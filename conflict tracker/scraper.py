import os
import sys
import time
from dotenv import load_dotenv
import random
import hashlib
import json
import logging
from datetime import datetime, timedelta
from urllib.parse import urlsplit, parse_qsl, urlencode

import feedparser
import requests
from bs4 import BeautifulSoup
from groq import Groq
from supabase import create_client

# Custom headers to avoid 403 blocks
CUSTOM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Ensure the module path includes the script's directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(local_env):
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv(dotenv_path=parent_env)

# ---------------- LOGGING SETUP ---------------- #
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

# ---------------- CONFIG & CLIENTS ---------------- #
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

FEEDS = [
    "https://www.premiumtimesng.com/feed",
    "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/",
    "https://dailytrust.com/feed/",
    "https://www.thecable.ng/feed",
    "https://www.channelstv.com/feed/"
]

# ---------------- CONCURRENCY LOCK ---------------- #
LOCK_FILE = os.path.join(os.path.dirname(__file__), "scraper.lock")
if os.path.exists(LOCK_FILE):
    logging.warning("SCRAPER ALREADY RUNNING. EXITING.")
    exit(0)

with open(LOCK_FILE, "w") as f:
    f.write("running")

# ---------------- NIGERIAN STATES VALIDATION MAP ---------------- #
NIGERIAN_STATES = {
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
}
STATE_MAP = {s.lower(): s for s in NIGERIAN_STATES}

# ---------------- UTILITY FUNCTIONS ---------------- #
def normalize_url(url):
    if not url:
        return ""
    parts = urlsplit(url.lower().strip())
    keep = {"id", "slug", "article"}
    q = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    return parts._replace(query=urlencode(q)).geturl()


def content_fp(title, text):
    base = f"{title.lower()}::{text[:1000].lower()}"
    return hashlib.sha256(base.encode()).hexdigest()


def semantic_fp(date_str, state, incident_type):
    """
    NUCLEAR MODE CRITERIA:
    Drops LGA and numerical metrics. If an incident of the same category occurs 
    ANYWHERE in the same state on the exact same date, it evaluates as a duplicate.
    """
    state = str(state).strip().lower() if state else "unknown"
    inc_type = str(incident_type).strip().lower() if incident_type else "unknown"
    
    base = f"{date_str}|{state}|{inc_type}"
    return hashlib.sha256(base.encode()).hexdigest()


# ---------------- WEB SCRAPING ---------------- #
def fetch_full_article(url):
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers=CUSTOM_HEADERS, timeout=10)
        r.raise_for_status()
        
        soup = BeautifulSoup(r.text, "html.parser")
        paras = soup.find_all("p")
        return "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)[:3000]
    except requests.exceptions.RequestException as e:
        logging.warning(f"Network error fetching {url}: {e}")
        return ""
    except Exception as e:
        logging.error(f"Unexpected error parsing {url}: {e}")
        return ""


# ---------------- NIGERIA FILTER HEURISTIC ---------------- #
NIGERIA_TERMS = [
    "nigeria", "abuja", "lagos", "kaduna", "kano", "borno", "plateau",
    "army", "police", "dss", "bandits", "boko haram", "herdsmen", 
    "kidnap", "kidnapped", "abducted", "hostage", "ransom"
]

def nigeria_score(text):
    text = text.lower()
    return sum(1 for t in NIGERIA_TERMS if t in text)


def is_nigeria_related(title, text):
    score = nigeria_score(title + " " + text)
    if score >= 3:
        return True
    if 1 <= score < 3:
        return "borderline"
    return False


# ---------------- AI INCIDENT EXTRACTION ---------------- #
def extract_incident(title, text, article_date, retries=3):
    if not client:
        logging.error("Groq API client is not initialized. Check your GROQ_API_KEY.")
        return None
        
    prompt = f"""
The article was published on: {article_date}.

Return strictly valid JSON only. Do not include markdown formatting.

CRITICAL AGGREGATE EXCLUSION RULE:
If this article is a military press briefing, a monthly/quarterly operational review, or an aggregate summary of multiple events over a long period (e.g., "troops neutralised 224 terrorists over the second quarter"), you MUST IGNORE IT. Return: {{"incidents": []}}. We only track discrete, individual, localized field incidents.

If the article is NOT related to a Nigerian security incident, or if the incident reported does NOT contain any confirmed fatalities or abductions, return:
{{"incidents": []}}

If it is a confirmed, discrete incident, extract an array of distinct incidents under the key "incidents". 
Each incident object must contain: state, lga, incident_type, fatalities, abductions, occurrence_date, summary.

CRITICAL RULES:
1. "incident_type" MUST be exactly one of these words: ["kidnapping", "banditry", "terrorism", "clash", "other"]. Do not use any other words.
2. "occurrence_date" MUST be the actual date the attack/incident happened in "YYYY-MM-DD" format. Use the article date ({article_date}) to calculate relative days.
3. Specifically capture kidnapping/abduction tracking metrics as integers.

EXAMPLE OUTPUT:
{{
    "incidents": [
        {{
            "state": "Kaduna",
            "lga": "Chikun",
            "incident_type": "kidnapping",
            "fatalities": 1,
            "abductions": 14,
            "occurrence_date": "2026-06-30",
            "summary": "Gunmen raided a village overnight, killing one community member and taking 14 hostages into the forest."
        }}
    ]
}}

Title: {title}
Text: {text}
"""
    for attempt in range(retries):
        try:
            res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            return res.choices[0].message.content
        except Exception as e:
            logging.warning(f"Groq API error on attempt {attempt + 1}: {e}")
            time.sleep(2)
            
    logging.error("Failed to extract context via AI after max retries.")
    return None


# ---------------- SAFE STORAGE ---------------- #
def safe_store(payload):
    if DRY_RUN:
        logging.info(f"[DRY RUN] Target Payload Insert:\n{json.dumps(payload, indent=2)}")
        return {"dry_run": True}

    # Because of the unique semantic_fp constraint, this upsert will automatically overwrite
    # the higher-casualty record with our newer, lower-casualty record.
    return supabase.table("incidents").upsert(
        payload,
        on_conflict="semantic_fp"
    ).execute()


def cleanup_invalid_records():
    if DRY_RUN:
        return
    try:
        logging.info("Running database cleanup for invalid/non-Nigerian states and old dates...")
        res = supabase.table("incidents").select("content_fp, state, date").execute()
        if not res.data:
            return
        
        to_delete = []
        for item in res.data:
            state = item.get("state", "").strip().lower()
            date_str = item.get("date")
            fp = item.get("content_fp")
            
            is_invalid = False
            if not state or state not in STATE_MAP:
                is_invalid = True
            
            if not date_str or date_str < "2026-07-01":
                is_invalid = True
                
            if is_invalid and fp:
                to_delete.append(fp)
                
        if to_delete:
            logging.info(f"Found {len(to_delete)} invalid records to clear.")
            for fp in to_delete:
                try:
                    supabase.table("incidents").delete().eq("content_fp", fp).execute()
                except Exception as ex:
                    logging.error(f"Failed to delete bad record {fp}: {ex}")
            logging.info("Database cleanup completed successfully.")
        else:
            logging.info("No invalid records found in the database.")
    except Exception as e:
        logging.error(f"Error during database cleanup: {e}")


# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("STARTING ULTRA-STRICT SECURITY SCRAPER PIPELINE")
    logging.info(f"DRY_RUN status: {DRY_RUN}")
    
    cleanup_invalid_records()

    stats = {
        "feeds": 0,
        "entries": 0,
        "saved_incidents": 0,
        "skipped_historical_events": 0,
        "skipped_no_impact": 0,
        "semantic_duplicates": 0,
        "semantic_duplicates_overwritten": 0,
        "ai_failed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

    # --- MEMORY MAP FOR ACTIVE LOWEST-NUMBER COMPARISON ---
    recent_semantic_map = {}
    try:
        fourteen_days_ago = (datetime.today() - timedelta(days=14)).strftime("%Y-%m-%d")
        # Pull down existing casualty totals for historical comparison
        res = supabase.table("incidents").select("semantic_fp, fatalities, abductions").gte("date", fourteen_days_ago).execute()
        
        for item in res.data:
            fp = item.get("semantic_fp")
            if fp:
                total_casualties = item.get("fatalities", 0) + item.get("abductions", 0)
                recent_semantic_map[fp] = total_casualties
                
        logging.info(f"Loaded {len(recent_semantic_map)} historical fingerprints for strict comparison.")
    except Exception as e:
        logging.error(f"Failed to fetch recent semantic_fps from Supabase: {e}")

    for feed in FEEDS:
        stats["feeds"] += 1
        logging.info(f"Parsing Feed Source: {feed}")
        f = feedparser.parse(feed)
        
        # --- TECHNICAL URL DEDUPLICATION SYSTEM ---
        current_urls = [normalize_url(e.link) for e in f.entries if e.get("link")]
        processed_batch = set()
        
        if current_urls:
            for attempt in range(3):
                try:
                    res = supabase.table("incidents").select("source_url").in_("source_url", current_urls).execute()
                    processed_batch = set(normalize_url(x["source_url"]) for x in res.data if x.get("source_url"))
                    break
                except Exception as e:
                    logging.warning(f"Supabase batch dedup attempt {attempt+1} failed: {e}")
                    time.sleep(2)

        for e in f.entries:
            stats["entries"] += 1
            url = normalize_url(e.link) if e.get("link") else ""
            if not url or url in processed_batch:
                continue

            pub_date = current_date
            t = e.get("published_parsed") or e.get("updated_parsed")
            if t:
                try:
                    pub_date = time.strftime("%Y-%m-%d", t)
                except Exception:
                    pass

            text = fetch_full_article(url)
            if not text or is_nigeria_related(e.title, text) is False:
                continue

            logging.info(f"Processing candidate article: {e.title}")

            # Pass the publish date to the LLM so it can calculate the actual event date
            ai_response = extract_incident(e.title, text, pub_date)
            if not ai_response:
                stats["ai_failed"] += 1
                continue

            try:
                data = json.loads(ai_response)
                incidents_list = data.get("incidents", [])
            except json.JSONDecodeError as ex:
                logging.error(f"JSON parsing exception for entry {e.title}: {ex}")
                stats["ai_failed"] += 1
                continue

            if not incidents_list:
                continue

            base_article_fp = content_fp(e.title, text)

            for idx, incident in enumerate(incidents_list):
                state_val = incident.get("state", "").strip().lower()
                
                # Enforce clean geographical mapping
                if state_val not in STATE_MAP:
                    logging.info(f"Skipping incident with unmapped state classification: {incident.get('state')}")
                    continue

                # The LLM extracted the actual date the incident occurred. 
                # Fallback to pub_date if LLM failed to return an occurrence_date.
                occurrence_date = incident.get("occurrence_date", pub_date)
                
                # HARD EVENT FILTER: Drop anything that actually happened before July 1, 2026.
                if occurrence_date < "2026-07-01":
                    logging.info(f"Skipping historical incident (Occurred: {occurrence_date}) despite recent publication ({pub_date}).")
                    stats["skipped_historical_events"] += 1
                    continue
                
                # --- STRATEGIC INT COUNT IMPACT VALIDATION ---
                try:
                    fatalities = int(incident.get("fatalities", 0))
                    abductions = int(incident.get("abductions", 0))
                except (ValueError, TypeError):
                    fatalities = 0
                    abductions = 0

                # Strict Verification Trigger Rule: Drop any item missing vital empirical metrics
                if fatalities == 0 and abductions == 0:
                    logging.info(f"Strict Filter Dropped Low-Impact Entity (0 Fatalities, 0 Abductions) in {state_val}.")
                    stats["skipped_no_impact"] += 1
                    continue

                clean_state = STATE_MAP[state_val]
                clean_lga = incident.get("lga", "Unknown").strip()
                clean_type = incident.get("incident_type", "other").strip().lower()
                current_total_casualties = fatalities + abductions
                
                # Evaluate Strict Semantic Fingerprint using the actual OCCURRENCE date, not the pub date.
                sem_fp = semantic_fp(occurrence_date, clean_state, clean_type)
                
                # ACTIVE COMPARISON ENGINE
                if sem_fp in recent_semantic_map:
                    existing_casualties = recent_semantic_map[sem_fp]
                    
                    if current_total_casualties < existing_casualties:
                        logging.info(f"Lower casualty count found ({current_total_casualties} vs {existing_casualties}). Overwriting {clean_state} record.")
                        # Update the local map so subsequent loop evaluations use this new baseline
                        recent_semantic_map[sem_fp] = current_total_casualties
                        stats["semantic_duplicates_overwritten"] += 1
                    else:
                        logging.info(f"Higher/Equal casualty count detected ({current_total_casualties} vs {existing_casualties}). Discarding duplicate.")
                        stats["semantic_duplicates"] += 1
                        continue
                else:
                    # New event, add to map
                    recent_semantic_map[sem_fp] = current_total_casualties
                
                unique_content_fp = f"{base_article_fp}_{idx}"

                payload = {
                    "date": occurrence_date,  # Save the ACTUAL occurrence date to the database
                    "state": clean_state,
                    "lga": clean_lga,
                    "incident_type": clean_type,
                    "fatalities": fatalities,
                    "abductions": abductions,
                    "summary": incident.get("summary"),
                    "source_url": url,
                    "content_fp": unique_content_fp,
                    "semantic_fp": sem_fp
                }

                try:
                    safe_store(payload)
                    stats["saved_incidents"] += 1
                except Exception as ex:
                    logging.error(f"Database sync exception dropped: {ex}")

    logging.info("\n===== PIPELINE FINAL EXECUTION REPORT =====")
    for key, value in stats.items():
        logging.info(f"{key.replace('_', ' ').title()}: {value}")
    logging.info("===========================================")


# ---------------- EXECUTION RUNNER ---------------- #
if __name__ == "__main__":
    try:
        run()
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
import os
import sys
import time
from dotenv import load_dotenv
import random

# Custom headers to avoid 403 blocks
CUSTOM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}
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


def semantic_fp(date_str, state, lga, incident_type, fatalities, abductions):
    # Normalize inputs to prevent hashing discrepancies from capitalization or missing data
    state = str(state).strip().lower() if state else "unknown"
    lga = str(lga).strip().lower() if lga else "unknown"
    inc_type = str(incident_type).strip().lower() if incident_type else "unknown"
    
    base = f"{date_str}|{state}|{lga}|{inc_type}|{fatalities}|{abductions}"
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
def extract_incident(title, text, retries=3):
    prompt = f"""
Return strictly valid JSON only. Do not include markdown formatting.

If the article is NOT related to a Nigerian security incident (including terrorism, banditry, clashes, or kidnapping/abductions), return:
{{"incidents": []}}

If it is related, extract an array of distinct incidents under the key "incidents". 
Each incident object must contain: state, lga, incident_type, fatalities, abductions, summary.
Ensure you specifically capture kidnapping/abduction tracking metrics.

EXAMPLE OUTPUT:
{{
    "incidents": [
        {{
            "state": "Kaduna",
            "lga": "Chikun",
            "incident_type": "kidnapping",
            "fatalities": 1,
            "abductions": 14,
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

    return supabase.table("incidents").upsert(
        payload,
        on_conflict="content_fp"
    ).execute()


# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("STARTING SECURITY SCRAPER PIPELINE")
    logging.info(f"DRY_RUN status: {DRY_RUN}")

    stats = {
        "feeds": 0,
        "entries": 0,
        "saved_incidents": 0,
        "skipped_nigeria": 0,
        "semantic_duplicates": 0,
        "ai_failed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

    # --- SEMANTIC DEDUPLICATION (7-DAY LOOKBACK) ---
    recent_semantic_fps = set()
    try:
        seven_days_ago = (datetime.today() - timedelta(days=7)).strftime("%Y-%m-%d")
        res = supabase.table("incidents").select("semantic_fp").gte("date", seven_days_ago).execute()
        recent_semantic_fps = set(x["semantic_fp"] for x in res.data if x.get("semantic_fp"))
        logging.info(f"Loaded {len(recent_semantic_fps)} recent semantic fingerprints for deduplication.")
    except Exception as e:
        logging.error(f"Failed to fetch recent semantic_fps from Supabase: {e}")

    for feed in FEEDS:
        stats["feeds"] += 1
        logging.info(f"Parsing Feed Source: {feed}")

        f = feedparser.parse(feed)
        
        # --- TECHNICAL URL DEDUPLICATION ---
        current_urls = [normalize_url(e.link) for e in f.entries if e.get("link")]
        processed_batch = set()
        if current_urls:
                # Retry up to 3 times to mitigate transient DNS/network errors
                for attempt in range(3):
                    try:
                        res = supabase.table("incidents").select("source_url").in_("source_url", current_urls).execute()
                        processed_batch = set(normalize_url(x["source_url"]) for x in res.data if x.get("source_url"))
                        break
                    except Exception as e:
                        logging.warning(f"Supabase batch dedup attempt {attempt+1} failed: {e}")
                        if attempt == 2:
                            raise
                        time.sleep(2)
                # If all attempts failed, log error
                try:
                    _ = processed_batch
                except NameError:
                    logging.error("Failed to fetch batch deduplication records after retries.")

        for e in f.entries:
            stats["entries"] += 1
            url = normalize_url(e.link) if e.get("link") else ""
            if not url:
                continue
            
            if url in processed_batch:
                continue

            # Get article publication date
            pub_date = current_date
            t = e.get("published_parsed") or e.get("updated_parsed")
            if t:
                try:
                    pub_date = time.strftime("%Y-%m-%d", t)
                except Exception:
                    pass

            text = fetch_full_article(url)
            if not text:
                continue

            if is_nigeria_related(e.title, text) is False:
                stats["skipped_nigeria"] += 1
                continue

            logging.info(f"Processing candidate article: {e.title}")

            ai_response = extract_incident(e.title, text)
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
                stats["skipped_nigeria"] += 1
                continue

            base_article_fp = content_fp(e.title, text)

            for idx, incident in enumerate(incidents_list):
                
                # Generate Semantic Fingerprint
                sem_fp = semantic_fp(
                    pub_date,
                    incident.get("state"),
                    incident.get("lga"),
                    incident.get("incident_type"),
                    incident.get("fatalities", 0),
                    incident.get("abductions", 0)
                )
                
                # Check for Semantic Duplication
                if sem_fp in recent_semantic_fps:
                    logging.info(f"Semantic duplicate caught! Skipping incident in {incident.get('state')}.")
                    stats["semantic_duplicates"] += 1
                    continue
                
                # Add to local memory so we don't save it twice if it appears in the same run
                recent_semantic_fps.add(sem_fp)

                unique_content_fp = f"{base_article_fp}_{idx}"

                payload = {
                    "date": pub_date,
                    "state": incident.get("state"),
                    "lga": incident.get("lga"),
                    "incident_type": incident.get("incident_type"),
                    "fatalities": incident.get("fatalities", 0),
                    "abductions": incident.get("abductions", 0),
                    "summary": incident.get("summary"),
                    "source_url": url,
                    "content_fp": unique_content_fp,
                    "semantic_fp": sem_fp
                }

                try:
                    safe_store(payload)
                    stats["saved_incidents"] += 1
                except Exception as ex:
                    logging.error(f"Database insertion exception on '{e.title}' (Index {idx}): {ex}")

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

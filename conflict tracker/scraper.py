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


def semantic_fp(date_str, state, lga, incident_type):
    """
    STRICT MODE CRITERIA:
    Drops numerical metrics entirely to resolve reporting divergence between outlets. 
    If an incident of the same structural type occurs within the same local geography 
    on the exact same date, it evaluates as a processing duplicate.
    """
    state = str(state).strip().lower() if state else "unknown"
    lga = str(lga).strip().lower() if lga else "unknown"
    inc_type = str(incident_type).strip().lower() if incident_type else "unknown"
    
    base = f"{date_str}|{state}|{lga}|{inc_type}"
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

If the article is NOT related to a Nigerian security incident, or if the incident reported does NOT contain any confirmed fatalities or abductions (i.e., both are zero or unconfirmed), return:
{{"incidents": []}}

If it is a confirmed incident with active casualties or abductions, extract an array of distinct incidents under the key "incidents". 
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
        on_conflict="semantic_fp"  # Enforce structural deduplication using semantic index constraint
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
            if not date_str or date_str < "2026-01-01":
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
        "skipped_nigeria": 0,
        "skipped_no_impact": 0,
        "semantic_duplicates": 0,
        "ai_failed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

    # --- AGGRESSIVE DEDUPLICATION: 14-DAY LOOKBACK WINDOW ---
    recent_semantic_fps = set()
    try:
        fourteen_days_ago = (datetime.today() - timedelta(days=14)).strftime("%Y-%m-%d")
        res = supabase.table("incidents").select("semantic_fp").gte("date", fourteen_days_ago).execute()
        recent_semantic_fps = set(x["semantic_fp"] for x in res.data if x.get("semantic_fp"))
        logging.info(f"Loaded {len(recent_semantic_fps)} historical semantic fingerprints to prevent duplicity.")
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
                state_val = incident.get("state", "").strip().lower()
                
                # Enforce clean geographical mapping
                if state_val not in STATE_MAP:
                    logging.info(f"Skipping incident with unmapped state classification: {incident.get('state')}")
                    continue

                if pub_date < "2026-01-01":
                    logging.info(f"Skipping chronological historical exception
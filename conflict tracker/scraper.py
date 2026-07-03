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

# LGA name normalization map for common variations
LGA_NORMALIZATION = {
    "chikun": "Chikun",
    "chikkun": "Chikun",
    "birnin gwari": "Birnin Gwari",
    "birningwari": "Birnin Gwari",
    "sabon gari": "Sabon Gari",
    "sabongari": "Sabon Gari",
    "jema'a": "Jema'a",
    "jemaa": "Jema'a",
    "kawo": "Kaduna North",  # Kawo is a district in Kaduna North
    "rigasa": "Igabi",  # Rigasa is in Igabi LGA
}

INCIDENT_CATEGORIES = [
    "Banditry", "Armed robbery", "Cult clashes", "Inter-communal clashes",
    "Insurgency (Boko Haram / ISWAP)", "Separatist agitations (IPOB / ESN)",
    "Farmer-herder conflicts", "Kidnapping for ransom", "Ethno-religious clashes",
    "Electoral and political violence", "Extrajudicial killings and state security force enforcement",
    "Mob violence and vigilantism (Jungle justice)", "Resource-control militancy (Oil bunkering and piracy)",
    "Chieftaincy and traditional title tussles", "Boundary and land disputes",
    "Urban gang and street thug violence (Area Boys / Yan Shara)", "Border clashes and transnational crime"
]

# ---------------- UTILITY FUNCTIONS ---------------- #
def normalize_url(url):
    if not url:
        return ""
    parts = urlsplit(url.lower().strip())
    keep = {"id", "slug", "article", "p"}
    q = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    return parts._replace(query=urlencode(q), fragment="").geturl()

def content_fp(title, text):
    """Generate fingerprint based on article title and first 1000 chars of text"""
    base = f"{title.lower().strip()}::{text[:1000].lower().strip()}"
    return hashlib.sha256(base.encode()).hexdigest()

def semantic_fp(date_str, state, lga, incident_type, fatalities, abductions):
    """
    IMPROVED FINGERPRINT: Uses broader matching criteria
    Groups by Date (within 2-day window) + State + Type + rounded casualty numbers
    """
    state = str(state).strip().lower() if state else "unknown"
    inc_type = str(incident_type).strip().lower() if incident_type else "unknown"
    
    # Normalize date to handle +/- 1 day differences (round to nearest 2-day window)
    try:
        event_date = datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
        # Create 2-day windows
        day_offset = event_date.day % 2
        normalized_date = (event_date - timedelta(days=day_offset)).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        normalized_date = str(date_str)[:10] if date_str else "unknown"
    
    # Round casualty numbers to nearest 5 to group similar reports
    total_casualties = int(fatalities or 0) + int(abductions or 0)
    if total_casualties > 0:
        rounded_casualties = (total_casualties // 5) * 5
    else:
        rounded_casualties = 0
    
    # Include LGA in the fingerprint if available
    lga_clean = str(lga).strip().lower() if lga and lga != "unknown" else ""
    
    if lga_clean:
        base = f"{normalized_date}|{state}|{inc_type}|{rounded_casualties}|{lga_clean}"
    else:
        base = f"{normalized_date}|{state}|{inc_type}|{rounded_casualties}"
    
    return hashlib.sha256(base.encode()).hexdigest()

def normalize_incident_data(incident):
    """Normalize incident data to reduce duplicates from minor variations"""
    # Normalize LGA names
    lga = incident.get("lga", "").strip()
    lga_lower = lga.lower()
    if lga_lower in LGA_NORMALIZATION:
        incident["lga"] = LGA_NORMALIZATION[lga_lower]
    elif lga:
        incident["lga"] = lga.title()
    
    # Normalize community names (basic)
    community = incident.get("community", "").strip()
    if community:
        # Remove common prefixes/suffixes
        community = community.replace("Village", "").replace("Town", "").strip()
        incident["community"] = community.title() if community else "Unknown"
    
    # Round large casualty numbers
    for field in ["fatalities", "abductions"]:
        try:
            val = int(incident.get(field, 0))
            if val > 10:
                incident[field] = round(val / 5) * 5
        except (ValueError, TypeError):
            incident[field] = 0
    
    return incident

def calculate_similarity_score(existing, new_state, new_lga, new_date, new_fatalities, new_abductions):
    """
    Calculate similarity score between two incident reports
    Returns score between 0 and 1
    """
    score = 0.0
    
    # State must match exactly
    if existing.get("state", "").lower() != new_state.lower():
        return 0.0
    
    # Incident type must match
    if existing.get("incident_type", "").lower() != new_state.lower():  # This should compare incident_type
        return 0.0
    
    # LGA similarity (fuzzy)
    existing_lga = existing.get("lga", "").lower()
    new_lga_clean = new_lga.lower() if new_lga else ""
    
    if existing_lga and new_lga_clean:
        if existing_lga == new_lga_clean:
            score += 0.4
        elif existing_lga in new_lga_clean or new_lga_clean in existing_lga:
            score += 0.2
    
    # Date proximity (higher score for closer dates)
    try:
        existing_date = datetime.strptime(str(existing.get("date", ""))[:10], "%Y-%m-%d")
        new_date_obj = datetime.strptime(str(new_date)[:10], "%Y-%m-%d")
        date_diff = abs((existing_date - new_date_obj).days)
        
        if date_diff == 0:
            score += 0.3
        elif date_diff == 1:
            score += 0.25
        elif date_diff == 2:
            score += 0.15
        elif date_diff <= 3:
            score += 0.1
    except (ValueError, TypeError):
        pass
    
    # Casualty similarity (within 20% range)
    existing_total = int(existing.get("fatalities", 0) or 0) + int(existing.get("abductions", 0) or 0)
    new_total = int(new_fatalities or 0) + int(new_abductions or 0)
    
    if existing_total > 0 and new_total > 0:
        ratio = min(existing_total, new_total) / max(existing_total, new_total)
        score += ratio * 0.3
    elif existing_total == 0 and new_total == 0:
        score += 0.3
    
    return score

def find_potential_duplicate(state, lga, incident_type, occurrence_date, fatalities, abductions):
    """
    Check database for potential duplicates using fuzzy matching
    """
    try:
        # Search for incidents within 4 days, same state and type
        event_date = datetime.strptime(str(occurrence_date)[:10], "%Y-%m-%d")
        date_start = (event_date - timedelta(days=4)).strftime("%Y-%m-%d")
        date_end = (event_date + timedelta(days=4)).strftime("%Y-%m-%d")
        
        # Build query - search same state and incident type within date range
        query = supabase.table("incidents")\
            .select("content_fp, semantic_fp, state, lga, incident_type, date, fatalities, abductions")\
            .gte("date", date_start)\
            .lte("date", date_end)\
            .eq("state", STATE_MAP.get(state.lower(), state))
        
        results = query.execute()
        
        if not results.data:
            return None
        
        # Score potential duplicates
        best_match = None
        best_score = 0.0
        
        for item in results.data:
            if item.get("incident_type") != incident_type:
                continue
                
            score = calculate_similarity_score(
                item, state, lga, occurrence_date, fatalities, abductions
            )
            
            if score > 0.65 and score > best_score:  # High similarity threshold
                best_score = score
                best_match = item
        
        return best_match if best_score > 0.65 else None
        
    except Exception as e:
        logging.error(f"Duplicate check failed: {e}")
        return None

# ---------------- WEB SCRAPING ---------------- #
def fetch_full_article(url):
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers=CUSTOM_HEADERS, timeout=15)
        r.raise_for_status()
        
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Try multiple content extraction strategies
        # Strategy 1: Article tag
        article = soup.find("article")
        if article:
            paras = article.find_all("p")
        else:
            # Strategy 2: Main content divs
            content_div = soup.find("div", class_=["entry-content", "post-content", "article-content", "content"])
            if content_div:
                paras = content_div.find_all("p")
            else:
                # Strategy 3: All paragraphs
                paras = soup.find_all("p")
        
        text = "\n".join(p.get_text().strip() for p in paras if len(p.get_text().strip()) > 30)
        return text[:3000]
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
    "kidnap", "kidnapped", "abducted", "hostage", "ransom", "cultists", "ipob",
    "iswap", "esn", "unknown gunmen", "soldiers", "troops"
]

def nigeria_score(text):
    text = text.lower()
    return sum(1 for t in NIGERIA_TERMS if t in text)

def is_nigeria_related(title, text):
    score = nigeria_score(title + " " + text)
    if score >= 3:
        return True
    if 1 <= score < 3:
        # Check for state names as additional signal
        state_mentions = sum(1 for state in STATE_MAP.keys() if state in (title + " " + text).lower())
        if state_mentions >= 1:
            return True
        return "borderline"
    return False

# ---------------- AI INCIDENT EXTRACTION ---------------- #
def extract_incident(title, text, article_date, retries=3):
    if not client:
        logging.error("Groq API client is not initialized. Check your GROQ_API_KEY.")
        return None
        
    categories_string = '", "'.join(INCIDENT_CATEGORIES)
        
    prompt = f"""
The article was published on: {article_date}.

Return strictly valid JSON only. Do not include markdown formatting.

CRITICAL DEDUPLICATION RULES:
1. If this article reports on an incident that has likely been reported by other news sources (same event, same location, similar timeframe), still extract it. We have a database deduplication system.
2. Only extract incidents that are NEW discrete events. Do NOT extract follow-up reports that simply recount previous incidents unless there are SIGNIFICANT new details (e.g., updated casualty count increased by 30% or more).

CRITICAL AGGREGATE EXCLUSION RULE:
If this article is a military press briefing, a monthly/quarterly operational review, or an aggregate summary of multiple events over a long period, return: {{"incidents": []}}.

CRITICAL IMPACT RULE:
Only extract incidents with CONFIRMED fatalities (deaths) OR abductions (kidnappings). Incidents with only "injuries" or "attacks" without casualties should return {{"incidents": []}}.

If the article contains a valid discrete incident, extract an array under the key "incidents". 
Each incident object must contain: state, lga, community, incident_type, fatalities, abductions, occurrence_date, summary.

CRITICAL RULES:
1. "incident_type" MUST be exactly one of: ["{categories_string}"].
2. "occurrence_date" MUST be the actual date the attack/incident happened in "YYYY-MM-DD" format. Calculate from the article date ({article_date}) using relative time references (e.g., "yesterday", "on Tuesday").
3. "fatalities" and "abductions" must be integers. If not mentioned, use 0.
4. "state" must be a Nigerian state name.
5. "lga" must be the Local Government Area (LGA) name.
6. "community" must be the specific village, town, or neighborhood where the event occurred. Be specific.
7. "summary" should be a one-sentence factual description of what happened.

EXAMPLE OUTPUT:
{{
    "incidents": [
        {{
            "state": "Kaduna",
            "lga": "Chikun",
            "community": "Kujama",
            "incident_type": "Kidnapping for ransom",
            "fatalities": 1,
            "abductions": 14,
            "occurrence_date": "2026-06-30",
            "summary": "Gunmen raided Kujama village in Chikun LGA, killing one resident and kidnapping 14 others."
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
        logging.info(f"[DRY RUN] Would store incident: {payload.get('state')} - {payload.get('incident_type')} ({payload.get('fatalities')} dead, {payload.get('abductions')} abducted)")
        return {"dry_run": True}

    try:
        result = supabase.table("incidents").upsert(
            payload,
            on_conflict="semantic_fp"
        ).execute()
        return result
    except Exception as e:
        logging.error(f"Failed to store incident: {e}")
        raise

def cleanup_invalid_records():
    """Remove records with invalid states or very old dates"""
    if DRY_RUN:
        logging.info("[DRY RUN] Would run database cleanup")
        return
        
    try:
        logging.info("Running database cleanup for invalid records...")
        
        # Delete records older than 2026-06-30
        cutoff_date = "2026-06-30"
        old_records = supabase.table("incidents")\
            .select("content_fp")\
            .lt("date", cutoff_date)\
            .execute()
        
        if old_records.data:
            fps_to_delete = [r["content_fp"] for r in old_records.data if r.get("content_fp")]
            logging.info(f"Removing {len(fps_to_delete)} records older than {cutoff_date}")
            for fp in fps_to_delete:
                try:
                    supabase.table("incidents").delete().eq("content_fp", fp).execute()
                except Exception as ex:
                    logging.error(f"Failed to delete old record {fp}: {ex}")
        
        # Delete records with invalid states
        all_records = supabase.table("incidents").select("content_fp, state").execute()
        if all_records.data:
            invalid_fps = []
            for r in all_records.data:
                state = (r.get("state") or "").strip().lower()
                if state and state not in STATE_MAP:
                    invalid_fps.append(r.get("content_fp"))
            
            if invalid_fps:
                logging.info(f"Removing {len(invalid_fps)} records with invalid states")
                for fp in invalid_fps:
                    try:
                        supabase.table("incidents").delete().eq("content_fp", fp).execute()
                    except Exception as ex:
                        logging.error(f"Failed to delete invalid record {fp}: {ex}")
        
        logging.info("Database cleanup completed successfully")
    except Exception as e:
        logging.error(f"Error during database cleanup: {e}")

def merge_duplicate_records():
    """Periodically merge duplicate records with same semantic fingerprint"""
    if DRY_RUN:
        logging.info("[DRY RUN] Would run duplicate merge")
        return
        
    try:
        logging.info("Running duplicate merge check...")
        
        # Find semantic fingerprints with multiple records
        all_records = supabase.table("incidents")\
            .select("semantic_fp, content_fp, fatalities, abductions, source_url")\
            .order("fatalities", desc=True)\
            .execute()
        
        if not all_records.data:
            return
        
        # Group by semantic_fp
        fp_groups = {}
        for record in all_records.data:
            fp = record.get("semantic_fp")
            if fp:
                if fp not in fp_groups:
                    fp_groups[fp] = []
                fp_groups[fp].append(record)
        
        duplicates_found = 0
        for fp, records in fp_groups.items():
            if len(records) > 1:
                # Keep the record with highest casualties, delete others
                best_record = max(records, key=lambda x: (x.get("fatalities", 0) + x.get("abductions", 0)))
                
                for record in records:
                    if record["content_fp"] != best_record["content_fp"]:
                        try:
                            supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                            duplicates_found += 1
                        except Exception as ex:
                            logging.error(f"Failed to merge duplicate {record['content_fp']}: {ex}")
        
        logging.info(f"Merged {duplicates_found} duplicate records")
    except Exception as e:
        logging.error(f"Error during duplicate merge: {e}")

# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("=" * 60)
    logging.info("STARTING DEDUPLICATED SECURITY SCRAPER PIPELINE")
    logging.info(f"DRY_RUN status: {DRY_RUN}")
    logging.info("=" * 60)
    
    # Run cleanup and merge before new scraping
    cleanup_invalid_records()
    merge_duplicate_records()

    stats = {
        "feeds_processed": 0,
        "entries_scanned": 0,
        "articles_fetched": 0,
        "ai_processed": 0,
        "incidents_extracted": 0,
        "incidents_saved": 0,
        "duplicates_detected": 0,
        "duplicates_overwritten": 0,
        "no_impact_skipped": 0,
        "invalid_state_skipped": 0,
        "ai_failed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

    # Load existing fingerprints for recent incidents (last 30 days)
    recent_incidents_cache = {}
    try:
        thirty_days_ago = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        res = supabase.table("incidents")\
            .select("semantic_fp, content_fp, fatalities, abductions, state, lga, incident_type, date")\
            .gte("date", thirty_days_ago)\
            .execute()
        
        for item in res.data:
            fp = item.get("semantic_fp")
            if fp:
                total_casualties = (item.get("fatalities", 0) or 0) + (item.get("abductions", 0) or 0)
                recent_incidents_cache[fp] = {
                    "total_casualties": total_casualties,
                    "content_fp": item.get("content_fp"),
                    "state": item.get("state"),
                    "lga": item.get("lga"),
                    "incident_type": item.get("incident_type"),
                    "date": item.get("date")
                }
                
        logging.info(f"Loaded {len(recent_incidents_cache)} recent incident fingerprints for deduplication")
    except Exception as e:
        logging.error(f"Failed to fetch recent incidents from Supabase: {e}")

    for feed_url in FEEDS:
        stats["feeds_processed"] += 1
        logging.info(f"\n{'='*40}")
        logging.info(f"Processing Feed: {feed_url}")
        logging.info(f"{'='*40}")
        
        try:
            feed = feedparser.parse(feed_url)
            
            if not feed.entries:
                logging.warning(f"No entries found in feed: {feed_url}")
                continue
            
            # Batch URL deduplication
            current_urls = [normalize_url(e.link) for e in feed.entries if e.get("link")]
            processed_urls = set()
            
            if current_urls:
                for attempt in range(3):
                    try:
                        res = supabase.table("incidents")\
                            .select("source_url")\
                            .in_("source_url", current_urls)\
                            .execute()
                        processed_urls = set(normalize_url(x["source_url"]) for x in res.data if x.get("source_url"))
                        logging.info(f"Found {len(processed_urls)} already processed URLs")
                        break
                    except Exception as e:
                        logging.warning(f"Supabase batch dedup attempt {attempt+1} failed: {e}")
                        time.sleep(2)
            
            # Process each entry
            for entry in feed.entries:
                stats["entries_scanned"] += 1
                
                url = normalize_url(entry.link) if entry.get("link") else ""
                if not url:
                    continue
                
                # Skip already processed URLs
                if url in processed_urls:
                    logging.debug(f"Skipping already processed URL: {url}")
                    continue
                
                # Determine publication date
                pub_date = current_date
                t = entry.get("published_parsed") or entry.get("updated_parsed")
                if t:
                    try:
                        pub_date = time.strftime("%Y-%m-%d", t)
                    except Exception:
                        pass
                
                # Fetch and validate article
                logging.info(f"Fetching: {entry.title[:100]}...")
                text = fetch_full_article(url)
                
                if not text:
                    logging.info(f"Skipping - empty article content")
                    continue
                
                stats["articles_fetched"] += 1
                
                # Check if Nigeria-related
                relevance = is_nigeria_related(entry.title, text)
                if relevance is False:
                    logging.info(f"Skipping - not Nigeria-related")
                    continue
                elif relevance == "borderline":
                    logging.info(f"Borderline Nigeria relevance, proceeding with caution")
                
                # AI extraction
                logging.info(f"AI processing: {entry.title[:100]}...")
                stats["ai_processed"] += 1
                
                ai_response = extract_incident(entry.title, text, pub_date)
                if not ai_response:
                    stats["ai_failed"] += 1
                    continue

                try:
                    data = json.loads(ai_response)
                    incidents_list = data.get("incidents", [])
                except json.JSONDecodeError as ex:
                    logging.error(f"JSON parsing failed for {entry.title[:50]}: {ex}")
                    stats["ai_failed"] += 1
                    continue

                if not incidents_list:
                    logging.info(f"No incidents extracted")
                    continue

                # Process each incident
                base_article_fp = content_fp(entry.title, text)

                for idx, incident in enumerate(incidents_list):
                    stats["incidents_extracted"] += 1
                    
                    # Normalize incident data
                    incident = normalize_incident_data(incident)
                    
                    # Validate state
                    state_val = incident.get("state", "").strip().lower()
                    if state_val not in STATE_MAP:
                        logging.info(f"Skipping incident with invalid state: {incident.get('state')}")
                        stats["invalid_state_skipped"] += 1
                        continue
                    
                    clean_state = STATE_MAP[state_val]
                    occurrence_date = incident.get("occurrence_date", pub_date)
                    
                    # Extract and validate casualties
                    try:
                        fatalities = int(incident.get("fatalities", 0) or 0)
                        abductions = int(incident.get("abductions", 0) or 0)
                    except (ValueError, TypeError):
                        fatalities = 0
                        abductions = 0

                    # Skip zero-impact incidents
                    if fatalities == 0 and abductions == 0:
                        logging.info(f"Skipping zero-impact incident in {clean_state}")
                        stats["no_impact_skipped"] += 1
                        continue

                    clean_lga = incident.get("lga", "Unknown").strip()
                    clean_community = incident.get("community", "Unknown").strip()
                    clean_type = incident.get("incident_type", "Other").strip()
                    current_total_casualties = fatalities + abductions
                    
                    # Generate semantic fingerprint
                    sem_fp = semantic_fp(
                        occurrence_date, clean_state, clean_lga, 
                        clean_type, fatalities, abductions
                    )
                    
                    # Check for existing similar incidents
                    if sem_fp in recent_incidents_cache:
                        existing = recent_incidents_cache[sem_fp]
                        existing_casualties = existing["total_casualties"]
                        
                        if current_total_casualties > existing_casualties:
                            logging.info(
                                f"OVERWRITING: Higher casualties ({current_total_casualties} vs {existing_casualties}) "
                                f"in {clean_state} - {clean_type}"
                            )
                            recent_incidents_cache[sem_fp]["total_casualties"] = current_total_casualties
                            stats["duplicates_overwritten"] += 1
                        else:
                            logging.info(
                                f"SKIPPING DUPLICATE: Lower/equal casualties ({current_total_casualties} vs {existing_casualties})"
                            )
                            stats["duplicates_detected"] += 1
                            continue
                    else:
                        # Check for fuzzy duplicates in database
                        potential_dup = find_potential_duplicate(
                            clean_state, clean_lga, clean_type, 
                            occurrence_date, fatalities, abductions
                        )
                        
                        if potential_dup:
                            existing_total = (potential_dup.get("fatalities", 0) or 0) + \
                                           (potential_dup.get("abductions", 0) or 0)
                            
                            if current_total_casualties <= existing_total:
                                logging.info(f"SKIPPING FUZZY DUPLICATE in {clean_state}")
                                stats["duplicates_detected"] += 1
                                continue
                            else:
                                logging.info(f"OVERWRITING FUZZY DUPLICATE with higher casualties")
                                stats["duplicates_overwritten"] += 1
                        
                        # Add to cache
                        recent_incidents_cache[sem_fp] = {
                            "total_casualties": current_total_casualties,
                            "content_fp": f"{base_article_fp}_{idx}",
                            "state": clean_state,
                            "lga": clean_lga,
                            "incident_type": clean_type,
                            "date": occurrence_date
                        }
                    
                    # Prepare and store payload
                    unique_content_fp = f"{base_article_fp}_{idx}"

                    payload = {
                        "date": occurrence_date, 
                        "state": clean_state,
                        "lga": clean_lga,
                        "community": clean_community,
                        "incident_type": clean_type,
                        "fatalities": fatalities,
                        "abductions": abductions,
                        "summary": incident.get("summary", f"{clean_type} incident in {clean_community}, {clean_lga} LGA, {clean_state}"),
                        "source_url": url,
                        "content_fp": unique_content_fp,
                        "semantic_fp": sem_fp
                    }

                    try:
                        safe_store(payload)
                        stats["incidents_saved"] += 1
                        logging.info(f"✓ SAVED: {clean_type} in {clean_community}, {clean_state} ({fatalities} dead, {abductions} abducted)")
                    except Exception as ex:
                        logging.error(f"Database storage failed: {ex}")
        
        except Exception as e:
            logging.error(f"Error processing feed {feed_url}: {e}")
            continue

    # Final merge pass
    merge_duplicate_records()

    # Print final statistics
    logging.info("\n" + "=" * 60)
    logging.info("PIPELINE EXECUTION COMPLETE")
    logging.info("=" * 60)
    for key, value in stats.items():
        logging.info(f"{key.replace('_', ' ').title()}: {value}")
    logging.info("=" * 60)

# ---------------- EXECUTION RUNNER ---------------- #
if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        logging.info("Scraper interrupted by user")
    except Exception as e:
        logging.error(f"Fatal error in scraper: {e}")
        raise
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
            logging.info("Lock file removed")
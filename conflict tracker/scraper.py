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

# ---------------- RATE LIMITER ---------------- #
class GroqRateLimiter:
    """Limits Groq API calls to stay within rate limits"""
    def __init__(self, max_rpm=25, max_tpm=6000):
        self.max_rpm = max_rpm  # Requests per minute (conservative)
        self.max_tpm = max_tpm  # Tokens per minute
        self.request_timestamps = []
        self.token_usage = []
    
    def wait_if_needed(self, estimated_tokens=1500):
        """Wait if we're approaching rate limits"""
        now = time.time()
        
        # Clean old entries (older than 60 seconds)
        self.request_timestamps = [t for t in self.request_timestamps if now - t < 60]
        self.token_usage = [(t, tokens) for t, tokens in self.token_usage if now - t < 60]
        
        # Check RPM limit
        if len(self.request_timestamps) >= self.max_rpm:
            wait_time = 60 - (now - self.request_timestamps[0]) + 2  # +2 second buffer
            logging.info(f"⏳ RPM limit ({self.max_rpm}/min) reached. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            # Recursive check after waiting
            return self.wait_if_needed(estimated_tokens)
        
        # Check TPM limit
        total_tokens = sum(tokens for _, tokens in self.token_usage)
        if total_tokens + estimated_tokens > self.max_tpm:
            wait_time = 60 - (now - self.token_usage[0][0]) + 2
            logging.info(f"⏳ TPM limit approaching. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        
        # Record this request
        self.request_timestamps.append(now)
        self.token_usage.append((now, estimated_tokens))
        
        # Add small delay between requests to be safe
        time.sleep(random.uniform(1.5, 3.0))

# Initialize rate limiter
groq_limiter = GroqRateLimiter(max_rpm=25)

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
    "kawo": "Kaduna North",
    "rigasa": "Igabi",
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
    
    # Round large casualty numbers to avoid minor variations
    for field in ["fatalities", "abductions"]:
        try:
            val = int(incident.get(field, 0))
            if val > 20:  # Only round very large numbers
                incident[field] = round(val / 5) * 5
        except (ValueError, TypeError):
            incident[field] = 0
    
    return incident

def is_potential_conflict_article(title, text):
    """Quick pre-filter to catch obvious non-conflict articles before AI processing"""
    combined = (title + " " + text).lower()
    
    # Keywords that suggest this is NOT a conflict incident
    non_conflict_keywords = [
        "suicide", "committed suicide", "took his own life", "hanged himself",
        "morning recap", "evening recap", "news roundup", "top stories",
        "traffic accident", "road crash", "auto crash", "car accident",
        "fire outbreak", "building collapse", "flood", "disease outbreak",
        "fashion", "sports", "entertainment", "celebrity", "music video",
        "arrested", "arraigned", "court", "sentenced", "convicted",
        "appointment", "promotion", "inauguration", "swearing in",
        "grammys", "award", "album", "movie", "film", "actor", "actress"
    ]
    
    # Conflict keywords that override non-conflict classification
    conflict_keywords = [
        "killed", "attack", "gunmen", "bandits", "terrorists", 
        "kidnapped", "abducted", "clash", "militants", "insurgents",
        "boko haram", "iswap", "herdsmen", "cultists", "massacre",
        "bomb", "explosion", "ambush", "raid", "assault"
    ]
    
    # Check for non-conflict keywords
    for keyword in non_conflict_keywords:
        if keyword in combined:
            # Count conflict signals to see if this is actually a conflict article
            conflict_score = sum(1 for kw in conflict_keywords if kw in combined)
            
            if conflict_score < 2:  # Not enough conflict signals
                logging.info(f"🚫 Pre-filtered non-conflict: '{keyword}' found with low conflict score ({conflict_score})")
                return False
    
    return True

def calculate_similarity_score(existing, new_state, new_lga, new_date, new_fatalities, new_abductions):
    """Calculate similarity score between two incident reports"""
    score = 0.0
    
    # State must match exactly
    if existing.get("state", "").lower() != new_state.lower():
        return 0.0
    
    # Incident type must match
    if existing.get("incident_type", "").lower() != new_state.lower():
        return 0.0
    
    # LGA similarity (fuzzy)
    existing_lga = existing.get("lga", "").lower()
    new_lga_clean = new_lga.lower() if new_lga else ""
    
    if existing_lga and new_lga_clean:
        if existing_lga == new_lga_clean:
            score += 0.4
        elif existing_lga in new_lga_clean or new_lga_clean in existing_lga:
            score += 0.2
    
    # Date proximity
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
    
    # Casualty similarity
    existing_total = int(existing.get("fatalities", 0) or 0) + int(existing.get("abductions", 0) or 0)
    new_total = int(new_fatalities or 0) + int(new_abductions or 0)
    
    if existing_total > 0 and new_total > 0:
        ratio = min(existing_total, new_total) / max(existing_total, new_total)
        score += ratio * 0.3
    elif existing_total == 0 and new_total == 0:
        score += 0.3
    
    return score

def find_potential_duplicate(state, lga, incident_type, occurrence_date, fatalities, abductions):
    """Check database for potential duplicates using fuzzy matching"""
    try:
        event_date = datetime.strptime(str(occurrence_date)[:10], "%Y-%m-%d")
        date_start = (event_date - timedelta(days=4)).strftime("%Y-%m-%d")
        date_end = (event_date + timedelta(days=4)).strftime("%Y-%m-%d")
        
        query = supabase.table("incidents")\
            .select("content_fp, semantic_fp, state, lga, incident_type, date, fatalities, abductions")\
            .gte("date", date_start)\
            .lte("date", date_end)\
            .eq("state", STATE_MAP.get(state.lower(), state))
        
        results = query.execute()
        
        if not results.data:
            return None
        
        best_match = None
        best_score = 0.0
        
        for item in results.data:
            if item.get("incident_type") != incident_type:
                continue
                
            score = calculate_similarity_score(
                item, state, lga, occurrence_date, fatalities, abductions
            )
            
            if score > 0.65 and score > best_score:
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
        article = soup.find("article")
        if article:
            paras = article.find_all("p")
        else:
            content_div = soup.find("div", class_=["entry-content", "post-content", "article-content", "content"])
            if content_div:
                paras = content_div.find_all("p")
            else:
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
1. If this article reports on an incident that has likely been reported by other news sources, still extract it. We have a database deduplication system.
2. Only extract incidents that are NEW discrete events. Do NOT extract follow-up reports that simply recount previous incidents unless there are SIGNIFICANT new details (e.g., casualty count increased by 30% or more).

CRITICAL EXCLUSION RULES - DO NOT EXTRACT THESE:
- Suicide incidents, self-harm, or accidental deaths
- Traffic accidents, road crashes, or transportation incidents (unless part of an attack)
- Natural disasters (floods, fires, building collapses) unless caused by an attack
- Disease outbreaks, health emergencies, or medical incidents
- Domestic violence or family disputes (unless part of a larger conflict pattern)
- Individual crimes without organized group involvement (e.g., personal disputes, bar fights)
- Police arrests, court cases, or legal proceedings without current violence
- Crime statistics, security reports, or aggregate summaries
- Political rhetoric, protests without violence, or peaceful demonstrations
- International news not directly related to Nigerian security incidents
- Morning recaps, evening roundups, or "top stories" compilations

ONLY EXTRACT incidents involving:
- Organized armed groups (bandits, terrorists, cultists, militants, etc.)
- Communal/clan/ethnic group violence with weapons
- Security force operations resulting in casualties
- Kidnappings by armed groups
- Farmer-herder clashes
- Political/electoral violence by organized groups

CRITICAL IMPACT RULE:
Only extract incidents with CONFIRMED fatalities (deaths) OR abductions (kidnappings). 
Incidents with only "injuries" or "attacks" without confirmed casualties should return {{"incidents": []}}.

If the article is NOT related to a Nigerian security incident as defined above, return:
{{"incidents": []}}

If the article contains a valid discrete security incident, extract an array under the key "incidents". 
Each incident object must contain: state, lga, community, incident_type, fatalities, abductions, occurrence_date, summary.

CRITICAL RULES:
1. "incident_type" MUST be exactly one of: ["{categories_string}"]
2. "occurrence_date" MUST be the actual date the attack/incident happened in "YYYY-MM-DD" format. Calculate from the article date ({article_date}) using relative time references.
3. "fatalities" and "abductions" must be integers. Report the ACTUAL CONFIRMED numbers from the article, not estimates or rounded figures.
4. "state" must be a Nigerian state name.
5. "lga" must be the Local Government Area (LGA) name.
6. "community" must be the specific village, town, or neighborhood where the event occurred.
7. "summary" should be a one-sentence factual description of the violent incident.

EXAMPLE OF CORRECT EXTRACTION:
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
            "summary": "Armed gunmen attacked Kujama village in Chikun LGA, killing one resident and kidnapping 14 others."
        }}
    ]
}}

EXAMPLE OF WHAT TO REJECT:
- "Man commits suicide in Lagos" -> {{"incidents": []}}
- "Morning recap: 10 stories you missed" -> {{"incidents": []}}
- "Police arrest 5 suspects" -> {{"incidents": []}} (unless there was a violent confrontation with casualties)

Title: {title}
Text: {text}
"""
    for attempt in range(retries):
        try:
            # Apply rate limiting before API call
            groq_limiter.wait_if_needed(estimated_tokens=1500)
            
            res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=1000
            )
            return res.choices[0].message.content
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "rate_limit" in error_str.lower():
                backoff_time = min(60, 10 * (2 ** attempt))  # Exponential backoff, max 60s
                logging.warning(f"⚠️ Rate limited on attempt {attempt + 1}. Waiting {backoff_time}s...")
                time.sleep(backoff_time)
            elif "401" in error_str:
                logging.error(f"🔑 Invalid API key. Please check your GROQ_API_KEY in .env")
                return None
            else:
                logging.warning(f"Groq API error on attempt {attempt + 1}: {e}")
                time.sleep(2)
            
    logging.error("Failed to extract context via AI after max retries.")
    return None

# ---------------- SAFE STORAGE ---------------- #
def safe_store(payload):
    if DRY_RUN:
        logging.info(f"[DRY RUN] Would store: {payload.get('state')} - {payload.get('incident_type')} ({payload.get('fatalities')} dead, {payload.get('abductions')} abducted)")
        return {"dry_run": True}

    try:
        # Use ON CONFLICT to update if semantic_fp exists and new casualties are higher
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
        
        all_records = supabase.table("incidents")\
            .select("semantic_fp, content_fp, fatalities, abductions, source_url, date")\
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
                best_record = max(records, key=lambda x: (x.get("fatalities", 0) or 0) + (x.get("abductions", 0) or 0))
                
                for record in records:
                    if record["content_fp"] != best_record["content_fp"]:
                        try:
                            supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                            duplicates_found += 1
                            logging.info(f"🗑️ Merged duplicate: {record.get('state')} - {record.get('incident_type')}")
                        except Exception as ex:
                            logging.error(f"Failed to merge duplicate {record['content_fp']}: {ex}")
        
        logging.info(f"Merged {duplicates_found} duplicate records")
    except Exception as e:
        logging.error(f"Error during duplicate merge: {e}")

# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("=" * 60)
    logging.info("🚀 STARTING CONFLICT SCRAPER PIPELINE")
    logging.info(f"DRY_RUN: {DRY_RUN} | Rate Limit: {groq_limiter.max_rpm} RPM")
    logging.info("=" * 60)
    
    # Run cleanup and merge before new scraping
    cleanup_invalid_records()
    merge_duplicate_records()

    stats = {
        "feeds_processed": 0,
        "entries_scanned": 0,
        "articles_fetched": 0,
        "prefiltered_non_conflict": 0,
        "ai_processed": 0,
        "incidents_extracted": 0,
        "incidents_saved": 0,
        "duplicates_detected": 0,
        "duplicates_overwritten": 0,
        "no_impact_skipped": 0,
        "invalid_state_skipped": 0,
        "ai_failed": 0,
        "url_reprocessed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

    # Load existing fingerprints for recent incidents (last 30 days)
    recent_incidents_cache = {}
    try:
        thirty_days_ago = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        res = supabase.table("incidents")\
            .select("semantic_fp, content_fp, fatalities, abductions, state, lga, incident_type, date, source_url")\
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
                    "date": item.get("date"),
                    "source_url": item.get("source_url")
                }
                
        logging.info(f"📊 Loaded {len(recent_incidents_cache)} recent incidents for deduplication")
    except Exception as e:
        logging.error(f"Failed to fetch recent incidents: {e}")

    for feed_url in FEEDS:
        stats["feeds_processed"] += 1
        logging.info(f"\n{'='*40}")
        logging.info(f"📡 Processing Feed: {feed_url}")
        logging.info(f"{'='*40}")
        
        try:
            feed = feedparser.parse(feed_url)
            
            if not feed.entries:
                logging.warning(f"No entries found in feed: {feed_url}")
                continue
            
            # Batch URL deduplication - check which URLs are already processed
            current_urls = [normalize_url(e.link) for e in feed.entries if e.get("link")]
            processed_url_map = {}  # url -> existing record data
            
            if current_urls:
                for attempt in range(3):
                    try:
                        res = supabase.table("incidents")\
                            .select("source_url, content_fp, fatalities, abductions, date")\
                            .in_("source_url", current_urls)\
                            .execute()
                        
                        for x in res.data:
                            url = normalize_url(x.get("source_url", ""))
                            if url:
                                processed_url_map[url] = {
                                    "content_fp": x.get("content_fp"),
                                    "fatalities": x.get("fatalities", 0) or 0,
                                    "abductions": x.get("abductions", 0) or 0,
                                    "date": x.get("date")
                                }
                        
                        logging.info(f"📋 Found {len(processed_url_map)} already processed URLs")
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
                
                # Check if URL was already processed
                if url in processed_url_map:
                    existing = processed_url_map[url]
                    existing_casualties = existing["fatalities"] + existing["abductions"]
                    
                    # If previously had 0 casualties, re-process (article might have been updated)
                    if existing_casualties == 0:
                        logging.info(f"🔄 Re-processing URL with previously 0 casualties: {entry.title[:80]}")
                        stats["url_reprocessed"] += 1
                    else:
                        logging.debug(f"Skipping already processed URL with {existing_casualties} casualties")
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
                logging.info(f"📄 Fetching: {entry.title[:100]}...")
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
                
                # Pre-filter non-conflict articles
                if not is_potential_conflict_article(entry.title, text):
                    stats["prefiltered_non_conflict"] += 1
                    continue
                
                # AI extraction
                logging.info(f"🤖 AI processing: {entry.title[:100]}...")
                stats["ai_processed"] += 1
                
                ai_response = extract_incident(entry.title, text, pub_date)
                if not ai_response:
                    stats["ai_failed"] += 1
                    continue

                try:
                    data = json.loads(ai_response)
                    incidents_list = data.get("incidents", [])
                except json.JSONDecodeError as ex:
                    logging.error(f"JSON parsing failed: {ex}")
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
                    incident = normalize_
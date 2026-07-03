import os
import sys
import time
import re
from dotenv import load_dotenv
import random
import hashlib
import json
import logging
from datetime import datetime, timedelta
from urllib.parse import urlsplit, parse_qsl, urlencode, urlparse

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
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm
        self.request_timestamps = []
        self.token_usage = []
    
    def wait_if_needed(self, estimated_tokens=1500):
        """Wait if we're approaching rate limits"""
        now = time.time()
        
        self.request_timestamps = [t for t in self.request_timestamps if now - t < 60]
        self.token_usage = [(t, tokens) for t, tokens in self.token_usage if now - t < 60]
        
        if len(self.request_timestamps) >= self.max_rpm:
            wait_time = 60 - (now - self.request_timestamps[0]) + 2
            logging.info(f"⏳ RPM limit ({self.max_rpm}/min) reached. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        
        total_tokens = sum(tokens for _, tokens in self.token_usage)
        if total_tokens + estimated_tokens > self.max_tpm:
            wait_time = 60 - (now - self.token_usage[0][0]) + 2
            logging.info(f"⏳ TPM limit approaching. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        
        self.request_timestamps.append(now)
        self.token_usage.append((now, estimated_tokens))
        time.sleep(random.uniform(1.5, 3.0))

groq_limiter = GroqRateLimiter(max_rpm=25)

# ---------------- SOURCE RELIABILITY SCORING ---------------- #
SOURCE_RELIABILITY = {
    "premiumtimesng.com": 0.90,
    "punchng.com": 0.85,
    "dailytrust.com": 0.85,
    "thecable.ng": 0.85,
    "channelstv.com": 0.80,
    "vanguardngr.com": 0.75,
    "saharareporters.com": 0.80,
    "thisdaylive.com": 0.85,
    "guardian.ng": 0.85,
    "leadership.ng": 0.75,
    "sunnewsonline.com": 0.70,
    "dailypost.ng": 0.65,
    "tribuneonlineng.com": 0.75,
    "independent.ng": 0.65,
}

RELIABILITY_FACTORS = {
    "has_police_confirmation": 0.15,
    "has_eyewitness_account": 0.10,
    "has_official_statement": 0.15,
    "has_multiple_sources": 0.10,
    "is_breaking_news": -0.10,
    "is_updated_story": 0.05,
    "has_conflicting_numbers": -0.15,
}

def extract_domain(url):
    """Extract domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return ""

def calculate_report_reliability(url, text, fatalities, abductions):
    """Calculate reliability score for a casualty report"""
    domain = extract_domain(url)
    base_reliability = SOURCE_RELIABILITY.get(domain, 0.5)
    text_lower = text.lower()
    
    reliability_score = base_reliability
    
    police_terms = ["police confirmed", "police spokesperson", "according to police", 
                    "dss", "military", "army spokesman", "defence headquarters"]
    if any(term in text_lower for term in police_terms):
        reliability_score += RELIABILITY_FACTORS["has_police_confirmation"]
    
    eyewitness_terms = ["eyewitness", "witness told", "survivor", "resident said", "villager said"]
    if any(term in text_lower for term in eyewitness_terms):
        reliability_score += RELIABILITY_FACTORS["has_eyewitness_account"]
    
    official_terms = ["governor", "commissioner", "chairman", "emir", "chief", "official statement"]
    if any(term in text_lower for term in official_terms):
        reliability_score += RELIABILITY_FACTORS["has_official_statement"]
    
    source_terms = ["sources", "according to", "told", "reported", "said"]
    source_count = sum(1 for term in source_terms if term in text_lower)
    if source_count >= 4:
        reliability_score += RELIABILITY_FACTORS["has_multiple_sources"]
    
    if "breaking" in text_lower[:200] or "preliminary" in text_lower:
        reliability_score += RELIABILITY_FACTORS["is_breaking_news"]
    
    if "update" in text_lower[:200] or "updated" in text_lower[:200]:
        reliability_score += RELIABILITY_FACTORS["is_updated_story"]
    
    if "conflicting" in text_lower or "disputed" in text_lower or "while others" in text_lower:
        reliability_score += RELIABILITY_FACTORS["has_conflicting_numbers"]
    
    return max(0.0, min(1.0, reliability_score))

# ---------------- NIGERIAN STATES VALIDATION MAP ---------------- #
NIGERIAN_STATES = {
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
}
STATE_MAP = {s.lower(): s for s in NIGERIAN_STATES}

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
    base = f"{title.lower().strip()}::{text[:1000].lower().strip()}"
    return hashlib.sha256(base.encode()).hexdigest()

def semantic_fp(date_str, state, lga, incident_type, fatalities, abductions):
    state = str(state).strip().lower() if state else "unknown"
    inc_type = str(incident_type).strip().lower() if incident_type else "unknown"
    
    try:
        event_date = datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
        day_offset = event_date.day % 2
        normalized_date = (event_date - timedelta(days=day_offset)).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        normalized_date = str(date_str)[:10] if date_str else "unknown"
    
    total_casualties = int(fatalities or 0) + int(abductions or 0)
    rounded_casualties = (total_casualties // 5) * 5 if total_casualties > 0 else 0
    
    lga_clean = str(lga).strip().lower() if lga and lga != "unknown" else ""
    
    if lga_clean:
        base = f"{normalized_date}|{state}|{inc_type}|{rounded_casualties}|{lga_clean}"
    else:
        base = f"{normalized_date}|{state}|{inc_type}|{rounded_casualties}"
    
    return hashlib.sha256(base.encode()).hexdigest()

def normalize_incident_data(incident):
    lga = incident.get("lga", "").strip()
    lga_lower = lga.lower()
    if lga_lower in LGA_NORMALIZATION:
        incident["lga"] = LGA_NORMALIZATION[lga_lower]
    elif lga:
        incident["lga"] = lga.title()
    
    community = incident.get("community", "").strip()
    if community:
        community = community.replace("Village", "").replace("Town", "").strip()
        incident["community"] = community.title() if community else "Unknown"
    
    for field in ["fatalities", "abductions"]:
        try:
            val = int(incident.get(field, 0))
            if val > 20:
                incident[field] = round(val / 5) * 5
        except (ValueError, TypeError):
            incident[field] = 0
    
    return incident

def is_rescue_operation(title, text):
    """Detect if article is primarily about a rescue operation"""
    combined = (title + " " + text).lower()
    
    strong_rescue_terms = [
        "rescued by", "freed by", "released by police", "rescued the victims",
        "successful rescue", "rescue operation", "police rescue", "troops rescue",
        "forest guards rescue", "vigilantes rescue", "hunters rescue",
        "rescued from", "freed from captivity", "reunited with families",
        "regained their freedom", "rescued unhurt", "victims rescued",
        "hostages freed", "captives freed", "abductees rescued"
    ]
    
    rescue_count = sum(1 for term in strong_rescue_terms if term in combined)
    
    if rescue_count >= 2:
        return True
    
    title_lower = title.lower()
    if any(term in title_lower for term in ["rescue", "rescued", "freed", "free "]):
        new_kidnap_terms = ["kidnapped", "abducted", "abduct", "kidnap", "taken"]
        if not any(term in title_lower for term in new_kidnap_terms):
            return True
    
    return False

def has_new_kidnapping(text):
    """Check if article reports a NEW kidnapping, not just a rescue"""
    text_lower = text.lower()
    
    new_kidnap_patterns = [
        "kidnapped on", "abducted on", "kidnapped yesterday", "abducted yesterday",
        "kidnapped at", "abducted at", "kidnapped from", "abducted from",
        "stormed the", "invaded the", "attacked the", "raided the",
        "whisked away", "taken hostage", "taken to an unknown"
    ]
    
    return any(pattern in text_lower for pattern in new_kidnap_patterns)

def extract_rescue_casualties(title, text):
    """For rescue operations, extract only NEW casualties (deaths during the operation)"""
    combined = (title + " " + text).lower()
    
    result = {
        "fatalities": 0,
        "abductions": 0,
        "is_rescue_operation": True,
        "fatalities_breakdown": {
            "security_forces": 0,
            "criminals": 0,
            "civilians": 0
        }
    }
    
    # Patterns for security force casualties
    security_patterns = [
        r"(\d+)\s*(?:soldiers|troops|policemen|police officers|operatives|personnel|security forces)\s*(?:killed|died|lost|dead|slain)",
        r"(?:soldiers|troops|policemen|police officers|operatives|personnel|security forces)\s*(?:killed|died|lost|dead|slain)[:\s]*(\d+)",
        r"lost\s*(\d+)\s*(?:soldiers|troops|policemen|operatives|personnel)",
        r"killed\s*(\d+)\s*(?:soldiers|troops|policemen|police|soldier)"
    ]
    
    # Patterns for criminal casualties
    criminal_patterns = [
        r"(\d+)\s*(?:bandits|kidnappers|terrorists|gunmen|criminals|militants)\s*(?:killed|neutralized|gunned|shot dead|eliminated)",
        r"(?:killed|neutralized|gunned down|shot dead|eliminated)\s*(\d+)\s*(?:bandits|kidnappers|terrorists|gunmen|criminals|militants)",
        r"(?:bandits|kidnappers|terrorists|gunmen)\s*(?:killed|neutralized)[:\s]*(\d+)",
        r"(\d+)\s*(?:bandits|terrorists|kidnappers|gunmen)\s*(?:were|got)\s*(?:killed|neutralized)"
    ]
    
    # Extract security force casualties
    for pattern in security_patterns:
        matches = re.findall(pattern, combined)
        for match in matches:
            try:
                result["fatalities_breakdown"]["security_forces"] += int(match)
            except:
                pass
    
    # Extract criminal casualties
    for pattern in criminal_patterns:
        matches = re.findall(pattern, combined)
        for match in matches:
            try:
                result["fatalities_breakdown"]["criminals"] += int(match)
            except:
                pass
    
    # Also check general kill patterns
    general_patterns = [
        r"(?:killed|neutralized|gunned down|shot dead)\s*(\d+)\s*(?:of the|suspected)?\s*(?:bandits|kidnappers|terrorists|gunmen)",
        r"(\d+)\s*(?:bandits|kidnappers|terrorists|gunmen|criminals)\s*(?:were|have been)?\s*(?:killed|neutralized)"
    ]
    
    for pattern in general_patterns:
        matches = re.findall(pattern, combined)
        for match in matches:
            try:
                result["fatalities_breakdown"]["criminals"] += int(match)
            except:
                pass
    
    result["fatalities"] = sum(result["fatalities_breakdown"].values())
    
    if result["fatalities"] > 0:
        return result
    
    return None

def is_potential_conflict_article(title, text):
    """Pre-filter non-conflict articles before AI processing"""
    combined = (title + " " + text).lower()
    
    # Keywords that suggest this is a rescue/recovery operation
    rescue_operation_keywords = [
        "rescue", "rescued", "rescues", "free", "freed", "frees",
        "police rescue", "troops rescue", "army rescue", "security forces rescue",
        "forest guard", "forest guards", "vigilante rescue",
        "reunited with", "returned to their", "released by",
        "regained freedom", "freed by police", "rescued by troops"
    ]
    
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
    
    conflict_keywords = [
        "killed", "attack", "gunmen", "bandits", "terrorists", 
        "kidnapped", "abducted", "clash", "militants", "insurgents",
        "boko haram", "iswap", "herdsmen", "cultists", "massacre",
        "bomb", "explosion", "ambush", "raid", "assault"
    ]
    
    # Check for rescue operations
    for keyword in rescue_operation_keywords:
        if keyword in combined:
            new_kidnap_indicators = [
                "kidnapped", "abducted", "abduct", "kidnap", 
                "taken", "seized", "captured", "snatched"
            ]
            
            kidnap_count = sum(1 for kw in new_kidnap_indicators if kw in combined)
            
            if kidnap_count == 0:
                # Check if there are casualties during rescue
                rescue_casualties = extract_rescue_casualties(title, text)
                if not rescue_casualties:
                    logging.info(f"🚫 Pre-filtered rescue operation with no casualties")
                    return False
                else:
                    logging.info(f"⚔️ Rescue operation with casualties - will process")
                    return True
            elif kidnap_count < 3:
                rescue_count = sum(1 for kw in rescue_operation_keywords if kw in combined)
                if rescue_count > kidnap_count:
                    # Still check for casualties
                    rescue_casualties = extract_rescue_casualties(title, text)
                    if not rescue_casualties:
                        logging.info(f"🚫 Pre-filtered rescue-focused article")
                        return False
    
    # Check for non-conflict keywords
    for keyword in non_conflict_keywords:
        if keyword in combined:
            conflict_score = sum(1 for kw in conflict_keywords if kw in combined)
            if conflict_score < 2:
                logging.info(f"🚫 Pre-filtered non-conflict: '{keyword}' found")
                return False
    
    return True

# ---------------- WEB SCRAPING ---------------- #
def fetch_full_article(url):
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers=CUSTOM_HEADERS, timeout=15)
        r.raise_for_status()
        
        soup = BeautifulSoup(r.text, "html.parser")
        
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

# ---------------- NIGERIA FILTER ---------------- #
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
        logging.error("Groq API client is not initialized.")
        return None
    
    # Pre-check if this is a rescue operation
    is_rescue = is_rescue_operation(title, text)
        
    categories_string = '", "'.join(INCIDENT_CATEGORIES)
        
    prompt = f"""
The article was published on: {article_date}.
{"CRITICAL: This appears to be a RESCUE OPERATION article. Only extract NEW fatalities that occurred during the rescue operation. Set abductions to 0 - rescued victims are NOT new abductions. Only count: security forces killed, criminals/bandits killed, or civilians killed during the rescue. Example: Troops rescue 50, kill 5 bandits, lose 3 soldiers → extract 8 fatalities, 0 abductions." if is_rescue else ""}

Return strictly valid JSON only. Do not include markdown formatting.

CRITICAL RULES FOR RESCUE OPERATIONS:
- ONLY extract if there are NEW fatalities during the rescue operation
- Set "abductions" to 0 - rescued victims are NOT new abductions
- Count ONLY: security forces killed, criminals/bandits killed, or civilians killed during the rescue
- If no one was killed during the rescue, return {{"incidents": []}}
- Summary should mention this was a rescue operation

CRITICAL EXCLUSION RULES - DO NOT EXTRACT:
- Rescue operations with NO fatalities (just freeing victims)
- Suicide, self-harm, or accidental deaths
- Traffic accidents or road crashes (unless part of an attack)
- Natural disasters, disease outbreaks, domestic violence
- Individual crimes without organized group involvement
- Police arrests without casualties
- Crime statistics or security reports
- Political rhetoric or peaceful protests
- Morning recaps, evening roundups, or "top stories" compilations

ONLY EXTRACT incidents involving:
- NEW attacks by organized armed groups (bandits, terrorists, cultists, militants)
- NEW communal/clan/ethnic group violence with weapons
- Security force operations resulting in NEW casualties (including rescue operations)
- NEW kidnappings by armed groups (not rescues of old kidnappings)
- NEW farmer-herder clashes
- NEW political/electoral violence by organized groups

CRITICAL IMPACT RULE:
Only extract incidents with CONFIRMED fatalities OR NEW abductions.
For rescue operations: ONLY extract if there are NEW fatalities.
For new incidents: Extract if there are fatalities OR new abductions.

Each incident object must contain: state, lga, community, incident_type, fatalities, abductions, occurrence_date, summary.

CRITICAL RULES:
1. "incident_type" MUST be exactly one of: ["{categories_string}"]
2. "occurrence_date" MUST be in "YYYY-MM-DD" format
3. "fatalities" and "abductions" must be integers (report ACTUAL confirmed numbers)
4. For rescue operations: abductions = 0, fatalities = deaths during operation
5. "state" must be a Nigerian state name
6. "lga" must be the Local Government Area name
7. "community" must be the specific village, town, or neighborhood
8. "summary" should be a one-sentence factual description

EXAMPLES:

NEW KIDNAPPING:
{{
    "incidents": [
        {{
            "state": "Kaduna",
            "lga": "Chikun",
            "community": "Kujama",
            "incident_type": "Kidnapping for ransom",
            "fatalities": 1,
            "abductions": 14,
            "occurrence_date": "2026-07-01",
            "summary": "Gunmen attacked Kujama village, killing 1 and kidnapping 14 residents."
        }}
    ]
}}

RESCUE WITH CASUALTIES:
{{
    "incidents": [
        {{
            "state": "Zamfara",
            "lga": "Maru",
            "community": "Kadanya Forest",
            "incident_type": "Extrajudicial killings and state security force enforcement",
            "fatalities": 8,
            "abductions": 0,
            "occurrence_date": "2026-07-01",
            "summary": "Troops rescued 50 hostages, killing 5 bandits and losing 3 soldiers in the operation."
        }}
    ]
}}

RESCUE WITHOUT CASUALTIES (REJECT):
{{"incidents": []}}

NEW CLASH:
{{
    "incidents": [
        {{
            "state": "Niger",
            "lga": "Shiroro",
            "community": "Kurebe",
            "incident_type": "Farmer-herder conflicts",
            "fatalities": 18,
            "abductions": 0,
            "occurrence_date": "2026-07-01",
            "summary": "Clashes between farmers and herders in Kurebe community resulted in 18 deaths."
        }}
    ]
}}

Title: {title}
Text: {text}
"""
    for attempt in range(retries):
        try:
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
            if "429" in error_str:
                backoff_time = min(60, 10 * (2 ** attempt))
                logging.warning(f"⚠️ Rate limited. Waiting {backoff_time}s...")
                time.sleep(backoff_time)
            elif "401" in error_str:
                logging.error("🔑 Invalid API key. Check GROQ_API_KEY in .env")
                return None
            else:
                logging.warning(f"API error attempt {attempt + 1}: {e}")
                time.sleep(2)
            
    logging.error("Failed to extract after max retries.")
    return None

# ---------------- SAFE STORAGE ---------------- #
def safe_store(payload):
    if DRY_RUN:
        logging.info(f"[DRY RUN] Would store: {payload.get('state')} - {payload.get('incident_type')} ({payload.get('fatalities')} dead, {payload.get('abductions')} abducted)")
        return {"dry_run": True}

    try:
        # Check if a record with same source_url already exists
        existing_url = supabase.table("incidents")\
            .select("content_fp, fatalities, abductions, source_url")\
            .eq("source_url", payload["source_url"])\
            .execute()
        
        if existing_url.data:
            for record in existing_url.data:
                existing_total = (record.get("fatalities", 0) or 0) + (record.get("abductions", 0) or 0)
                new_total = payload["fatalities"] + payload["abductions"]
                
                if new_total >= existing_total:
                    supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                    logging.info(f"🗑️ Replaced existing URL record (old: {existing_total} cas, new: {new_total} cas)")
                else:
                    logging.info(f"Keeping existing URL record with higher casualties")
                    return {"skipped": True}
        
        # Check for same semantic_fp with reliability comparison
        existing_semantic = supabase.table("incidents")\
            .select("content_fp, fatalities, abductions, source_url, summary")\
            .eq("semantic_fp", payload["semantic_fp"])\
            .execute()
        
        if existing_semantic.data:
            for record in existing_semantic.data:
                existing_domain = extract_domain(record.get("source_url", ""))
                new_domain = extract_domain(payload.get("source_url", ""))
                
                existing_reliability = SOURCE_RELIABILITY.get(existing_domain, 0.5)
                new_reliability = calculate_report_reliability(
                    payload.get("source_url", ""), 
                    payload.get("summary", ""), 
                    payload["fatalities"], 
                    payload["abductions"]
                )
                
                existing_total = (record.get("fatalities", 0) or 0) + (record.get("abductions", 0) or 0)
                new_total = payload["fatalities"] + payload["abductions"]
                
                should_replace = False
                
                if new_reliability > (existing_reliability + 0.15):
                    should_replace = True
                    logging.info(f"✅ More reliable source: {new_domain}({new_reliability:.2f}) > {existing_domain}({existing_reliability:.2f})")
                elif new_reliability >= 0.7 and existing_reliability >= 0.7 and new_total > existing_total:
                    should_replace = True
                    logging.info(f"✅ Higher casualties from reliable source")
                elif existing_reliability < 0.6 and new_reliability > existing_reliability and new_total >= existing_total:
                    should_replace = True
                    logging.info(f"✅ Replacing low-reliability report")
                
                if should_replace:
                    supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                    logging.info(f"🗑️ Replaced with more reliable/casualty report")
                else:
                    logging.info(f"Keeping existing report (reliability: {existing_reliability:.2f} vs {new_reliability:.2f})")
                    return {"skipped": True}
        
        # Insert new record
        result = supabase.table("incidents").upsert(
            payload,
            on_conflict="semantic_fp"
        ).execute()
        return result
        
    except Exception as e:
        logging.error(f"Failed to store incident: {e}")
        raise

def cleanup_invalid_records():
    """Remove records with invalid states or old dates"""
    if DRY_RUN:
        logging.info("[DRY RUN] Would run database cleanup")
        return
        
    try:
        logging.info("Running database cleanup...")
        
        cutoff_date = "2026-06-30"
        old_records = supabase.table("incidents").select("content_fp").lt("date", cutoff_date).execute()
        
        if old_records.data:
            for r in old_records.data:
                try:
                    supabase.table("incidents").delete().eq("content_fp", r["content_fp"]).execute()
                except:
                    pass
        
        all_records = supabase.table("incidents").select("content_fp, state").execute()
        if all_records.data:
            for r in all_records.data:
                state = (r.get("state") or "").strip().lower()
                if state and state not in STATE_MAP:
                    try:
                        supabase.table("incidents").delete().eq("content_fp", r["content_fp"]).execute()
                    except:
                        pass
        
        logging.info("Database cleanup completed")
    except Exception as e:
        logging.error(f"Cleanup error: {e}")

def merge_duplicate_records():
    """Merge records with same semantic
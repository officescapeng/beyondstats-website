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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
local_env = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
if os.path.exists(local_env):
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv(dotenv_path=parent_env)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)

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

LOCK_FILE = os.path.join(os.path.dirname(__file__), "scraper.lock")
if os.path.exists(LOCK_FILE):
    logging.warning("SCRAPER ALREADY RUNNING. EXITING.")
    exit(0)
with open(LOCK_FILE, "w") as f:
    f.write("running")

class GroqRateLimiter:
    def __init__(self, max_rpm=25, max_tpm=6000):
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm
        self.request_timestamps = []
        self.token_usage = []
    
    def wait_if_needed(self, estimated_tokens=1500):
        now = time.time()
        self.request_timestamps = [t for t in self.request_timestamps if now - t < 60]
        self.token_usage = [(t, tokens) for t, tokens in self.token_usage if now - t < 60]
        if len(self.request_timestamps) >= self.max_rpm:
            wait_time = 60 - (now - self.request_timestamps[0]) + 2
            logging.info(f"Rate limit reached. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        total_tokens = sum(tokens for _, tokens in self.token_usage)
        if total_tokens + estimated_tokens > self.max_tpm:
            wait_time = 60 - (now - self.token_usage[0][0]) + 2
            logging.info(f"Token limit approaching. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        self.request_timestamps.append(now)
        self.token_usage.append((now, estimated_tokens))
        time.sleep(random.uniform(1.5, 3.0))

groq_limiter = GroqRateLimiter(max_rpm=25)

SOURCE_RELIABILITY = {
    "premiumtimesng.com": 0.90, "punchng.com": 0.85, "dailytrust.com": 0.85,
    "thecable.ng": 0.85, "channelstv.com": 0.80, "vanguardngr.com": 0.75,
}

def extract_domain(url):
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return ""

def calculate_report_reliability(url, text, fatalities, abductions):
    domain = extract_domain(url)
    score = SOURCE_RELIABILITY.get(domain, 0.5)
    text_lower = text.lower()
    if any(t in text_lower for t in ["police confirmed", "police spokesperson", "according to police", "dss", "military", "army spokesman"]):
        score += 0.15
    if any(t in text_lower for t in ["eyewitness", "witness told", "survivor", "resident said"]):
        score += 0.10
    if any(t in text_lower for t in ["governor", "commissioner", "chairman", "official statement"]):
        score += 0.15
    if sum(1 for t in ["sources", "according to", "told", "reported", "said"] if t in text_lower) >= 4:
        score += 0.10
    if "breaking" in text_lower[:200] or "preliminary" in text_lower:
        score -= 0.10
    if "update" in text_lower[:200] or "updated" in text_lower[:200]:
        score += 0.05
    if "conflicting" in text_lower or "disputed" in text_lower:
        score -= 0.15
    return max(0.0, min(1.0, score))

NIGERIAN_STATES = {
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
}
STATE_MAP = {s.lower(): s for s in NIGERIAN_STATES}

LGA_NORMALIZATION = {
    "chikun": "Chikun", "chikkun": "Chikun",
    "birnin gwari": "Birnin Gwari", "birningwari": "Birnin Gwari",
    "sabon gari": "Sabon Gari", "sabongari": "Sabon Gari",
    "jema'a": "Jema'a", "jemaa": "Jema'a",
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
        normalized_date = (event_date - timedelta(days=event_date.day % 2)).strftime("%Y-%m-%d")
    except:
        normalized_date = str(date_str)[:10] if date_str else "unknown"
    total_casualties = int(fatalities or 0) + int(abductions or 0)
    rounded_casualties = (total_casualties // 5) * 5 if total_casualties > 0 else 0
    lga_clean = str(lga).strip().lower() if lga and lga != "unknown" else ""
    base = f"{normalized_date}|{state}|{inc_type}|{rounded_casualties}"
    if lga_clean:
        base += f"|{lga_clean}"
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
        except:
            incident[field] = 0
    return incident

def is_rescue_operation(title, text):
    combined = (title + " " + text).lower()
    strong_rescue_terms = [
        "rescued by", "freed by", "released by police", "rescued the victims",
        "successful rescue", "rescue operation", "police rescue", "troops rescue",
        "forest guards rescue", "vigilantes rescue", "hunters rescue",
        "rescued from", "freed from captivity", "reunited with families",
        "regained their freedom", "victims rescued", "hostages freed", "captives freed"
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

def extract_rescue_casualties(title, text):
    combined = (title + " " + text).lower()
    result = {"fatalities": 0, "abductions": 0, "security_forces": 0, "criminals": 0, "civilians": 0}
    
    security_patterns = [
        r"(\d+)\s*(?:soldiers|troops|policemen|police officers|operatives|personnel)\s*(?:killed|died|lost|dead|slain)",
        r"lost\s*(\d+)\s*(?:soldiers|troops|policemen|operatives|personnel)",
        r"killed\s*(\d+)\s*(?:soldiers|troops|policemen|police|soldier)"
    ]
    criminal_patterns = [
        r"(\d+)\s*(?:bandits|kidnappers|terrorists|gunmen|criminals|militants)\s*(?:killed|neutralized|gunned|shot dead|eliminated)",
        r"(?:killed|neutralized|gunned down|shot dead|eliminated)\s*(\d+)\s*(?:bandits|kidnappers|terrorists|gunmen|criminals|militants)",
        r"(\d+)\s*(?:bandits|terrorists|kidnappers|gunmen)\s*(?:were|got)\s*(?:killed|neutralized)"
    ]
    
    for pattern in security_patterns:
        for match in re.findall(pattern, combined):
            try:
                result["security_forces"] += int(match)
            except:
                pass
    for pattern in criminal_patterns:
        for match in re.findall(pattern, combined):
            try:
                result["criminals"] += int(match)
            except:
                pass
    
    result["fatalities"] = result["security_forces"] + result["criminals"] + result["civilians"]
    if result["fatalities"] > 0:
        return result
    return None

def is_potential_conflict_article(title, text):
    combined = (title + " " + text).lower()
    rescue_keywords = ["rescue", "rescued", "rescues", "free", "freed", "frees", "police rescue", "troops rescue", "forest guard", "forest guards", "reunited with", "returned to their", "released by", "regained freedom", "freed by police", "rescued by troops"]
    non_conflict_keywords = ["suicide", "committed suicide", "took his own life", "hanged himself", "morning recap", "evening recap", "news roundup", "top stories", "traffic accident", "road crash", "auto crash", "car accident", "fire outbreak", "building collapse", "flood", "disease outbreak", "fashion", "sports", "entertainment", "celebrity", "music video", "arrested", "arraigned", "court", "sentenced", "convicted", "appointment", "promotion", "inauguration", "swearing in", "grammys", "award", "album", "movie", "film", "actor", "actress"]
    conflict_keywords = ["killed", "attack", "gunmen", "bandits", "terrorists", "kidnapped", "abducted", "clash", "militants", "insurgents", "boko haram", "iswap", "herdsmen", "cultists", "massacre", "bomb", "explosion", "ambush", "raid", "assault"]
    
    for keyword in rescue_keywords:
        if keyword in combined:
            new_kidnap_indicators = ["kidnapped", "abducted", "abduct", "kidnap", "taken", "seized", "captured", "snatched"]
            kidnap_count = sum(1 for kw in new_kidnap_indicators if kw in combined)
            if kidnap_count == 0:
                rescue_casualties = extract_rescue_casualties(title, text)
                if not rescue_casualties:
                    logging.info("Pre-filtered rescue operation with no casualties")
                    return False
                else:
                    logging.info("Rescue operation with casualties - will process")
                    return True
    
    for keyword in non_conflict_keywords:
        if keyword in combined:
            conflict_score = sum(1 for kw in conflict_keywords if kw in combined)
            if conflict_score < 2:
                logging.info(f"Pre-filtered non-conflict: '{keyword}' found")
                return False
    return True

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
    except Exception as e:
        logging.warning(f"Error fetching {url}: {e}")
        return ""

NIGERIA_TERMS = ["nigeria", "abuja", "lagos", "kaduna", "kano", "borno", "plateau", "army", "police", "dss", "bandits", "boko haram", "herdsmen", "kidnap", "kidnapped", "abducted", "hostage", "ransom", "cultists", "ipob", "iswap", "esn", "unknown gunmen", "soldiers", "troops"]

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

def extract_incident(title, text, article_date, retries=3):
    if not client:
        logging.error("Groq API client is not initialized.")
        return None
    
    is_rescue = is_rescue_operation(title, text)
    categories_string = '", "'.join(INCIDENT_CATEGORIES)
    
    prompt = f"""The article was published on: {article_date}.
{"CRITICAL: This is a RESCUE OPERATION. Only extract NEW fatalities during the rescue. Set abductions to 0. Count: security forces killed, criminals killed, or civilians killed during the rescue. If no one was killed, return empty incidents." if is_rescue else ""}

Return strictly valid JSON only. No markdown.

CRITICAL RULES:
- Rescue operations: ONLY extract if there are NEW fatalities. Set abductions=0.
- Suicide, accidents, natural disasters, arrests without casualties, recaps, roundups: return {{"incidents": []}}
- Only extract confirmed fatalities OR new abductions from armed group attacks

Each incident: state, lga, community, incident_type, fatalities, abductions, occurrence_date, summary.
incident_type MUST be one of: ["{categories_string}"]
occurrence_date MUST be YYYY-MM-DD format.
fatalities and abductions must be integers.

EXAMPLES:
NEW KIDNAPPING: {{"incidents": [{{"state": "Kaduna", "lga": "Chikun", "community": "Kujama", "incident_type": "Kidnapping for ransom", "fatalities": 1, "abductions": 14, "occurrence_date": "2026-07-01", "summary": "Gunmen attacked Kujama village, killing 1 and kidnapping 14."}}]}}
RESCUE WITH CASUALTIES: {{"incidents": [{{"state": "Zamfara", "lga": "Maru", "community": "Kadanya Forest", "incident_type": "Extrajudicial killings and state security force enforcement", "fatalities": 8, "abductions": 0, "occurrence_date": "2026-07-01", "summary": "Troops rescued 50 hostages, killing 5 bandits and losing 3 soldiers."}}]}}
RESCUE WITHOUT CASUALTIES: {{"incidents": []}}
NON-CONFLICT: {{"incidents": []}}

Title: {title}
Text: {text}"""
    
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
                logging.warning(f"Rate limited. Waiting {backoff_time}s...")
                time.sleep(backoff_time)
            elif "401" in error_str:
                logging.error("Invalid API key. Check GROQ_API_KEY in .env")
                return None
            else:
                logging.warning(f"API error attempt {attempt + 1}: {e}")
                time.sleep(2)
    logging.error("Failed to extract after max retries.")
    return None

def safe_store(payload):
    if DRY_RUN:
        logging.info(f"[DRY RUN] Would store: {payload.get('state')} - {payload.get('incident_type')} ({payload.get('fatalities')} dead, {payload.get('abductions')} abducted)")
        return {"dry_run": True}
    try:
        existing_url = supabase.table("incidents").select("content_fp, fatalities, abductions").eq("source_url", payload["source_url"]).execute()
        if existing_url.data:
            for record in existing_url.data:
                existing_total = (record.get("fatalities", 0) or 0) + (record.get("abductions", 0) or 0)
                new_total = payload["fatalities"] + payload["abductions"]
                if new_total >= existing_total:
                    supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                else:
                    return {"skipped": True}
        
        existing_semantic = supabase.table("incidents").select("content_fp, fatalities, abductions, source_url, summary").eq("semantic_fp", payload["semantic_fp"]).execute()
        if existing_semantic.data:
            for record in existing_semantic.data:
                existing_domain = extract_domain(record.get("source_url", ""))
                new_domain = extract_domain(payload.get("source_url", ""))
                existing_reliability = SOURCE_RELIABILITY.get(existing_domain, 0.5)
                new_reliability = calculate_report_reliability(payload.get("source_url", ""), payload.get("summary", ""), payload["fatalities"], payload["abductions"])
                existing_total = (record.get("fatalities", 0) or 0) + (record.get("abductions", 0) or 0)
                new_total = payload["fatalities"] + payload["abductions"]
                should_replace = False
                if new_reliability > (existing_reliability + 0.15):
                    should_replace = True
                elif new_reliability >= 0.7 and existing_reliability >= 0.7 and new_total > existing_total:
                    should_replace = True
                elif existing_reliability < 0.6 and new_reliability > existing_reliability and new_total >= existing_total:
                    should_replace = True
                if should_replace:
                    supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                else:
                    return {"skipped": True}
        
        result = supabase.table("incidents").upsert(payload, on_conflict="semantic_fp").execute()
        return result
    except Exception as e:
        logging.error(f"Failed to store incident: {e}")
        raise

def cleanup_invalid_records():
    if DRY_RUN:
        return
    try:
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
    except Exception as e:
        logging.error(f"Cleanup error: {e}")

def merge_duplicate_records():
    if DRY_RUN:
        return
    try:
        all_records = supabase.table("incidents").select("semantic_fp, content_fp, fatalities, abductions, source_url").order("fatalities", desc=True).execute()
        if not all_records.data:
            return
        fp_groups = {}
        for record in all_records.data:
            fp = record.get("semantic_fp")
            if fp:
                if fp not in fp_groups:
                    fp_groups[fp] = []
                fp_groups[fp].append(record)
        merged = 0
        for fp, records in fp_groups.items():
            if len(records) > 1:
                best = max(records, key=lambda r: (SOURCE_RELIABILITY.get(extract_domain(r.get("source_url", "")), 0.5) * 10) + ((r.get("fatalities", 0) or 0) + (r.get("abductions", 0) or 0)))
                for record in records:
                    if record["content_fp"] != best["content_fp"]:
                        try:
                            supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                            merged += 1
                        except:
                            pass
        if merged > 0:
            logging.info(f"Merged {merged} duplicate records")
    except Exception as e:
        logging.error(f"Merge error: {e}")

def run():
    logging.info("=" * 60)
    logging.info("STARTING CONFLICT SCRAPER PIPELINE")
    logging.info(f"DRY_RUN: {DRY_RUN} | Rate Limit: {groq_limiter.max_rpm} RPM")
    logging.info("=" * 60)
    
    cleanup_invalid_records()
    merge_duplicate_records()

    stats = {
        "feeds_processed": 0, "entries_scanned": 0, "articles_fetched": 0,
        "prefiltered_non_conflict": 0, "ai_processed": 0, "incidents_extracted": 0,
        "incidents_saved": 0, "duplicates_detected": 0, "duplicates_overwritten": 0,
        "no_impact_skipped": 0, "invalid_state_skipped": 0, "ai_failed": 0, "url_reprocessed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")
    recent_incidents_cache = {}
    
    try:
        thirty_days_ago = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        res = supabase.table("incidents").select("semantic_fp, content_fp, fatalities, abductions, state, lga, incident_type, date, source_url").gte("date", thirty_days_ago).execute()
        for item in res.data:
            fp = item.get("semantic_fp")
            if fp:
                total_casualties = (item.get("fatalities", 0) or 0) + (item.get("abductions", 0) or 0)
                recent_incidents_cache[fp] = {
                    "total_casualties": total_casualties, "content_fp": item.get("content_fp"),
                    "state": item.get("state"), "lga": item.get("lga"),
                    "incident_type": item.get("incident_type"), "date": item.get("date"),
                    "source_url": item.get("source_url")
                }
        logging.info(f"Loaded {len(recent_incidents_cache)} recent incidents")
    except Exception as e:
        logging.error(f"Failed to fetch recent incidents: {e}")

    for feed_url in FEEDS:
        stats["feeds_processed"] += 1
        logging.info(f"Processing Feed: {feed_url}")
        
        try:
            feed = feedparser.parse(feed_url)
            if not feed.entries:
                continue
            
            current_urls = [normalize_url(e.link) for e in feed.entries if e.get("link")]
            processed_url_map = {}
            
            if current_urls:
                for attempt in range(3):
                    try:
                        res = supabase.table("incidents").select("source_url, content_fp, fatalities, abductions, date").in_("source_url", current_urls).execute()
                        for x in res.data:
                            url = normalize_url(x.get("source_url", ""))
                            if url:
                                processed_url_map[url] = {
                                    "content_fp": x.get("content_fp"),
                                    "fatalities": x.get("fatalities", 0) or 0,
                                    "abductions": x.get("abductions", 0) or 0,
                                    "date": x.get("date")
                                }
                        logging.info(f"Found {len(processed_url_map)} processed URLs")
                        break
                    except:
                        time.sleep(2)
            
            for entry in feed.entries:
                stats["entries_scanned"] += 1
                url = normalize_url(entry.link) if entry.get("link") else ""
                if not url:
                    continue
                
                existing_record_fp = None
                if url in processed_url_map:
                    existing = processed_url_map[url]
                    existing_casualties = existing["fatalities"] + existing["abductions"]
                    if existing_casualties == 0:
                        stats["url_reprocessed"] += 1
                        existing_record_fp = existing["content_fp"]
                    else:
                        continue
                
                pub_date = current_date
                t = entry.get("published_parsed") or entry.get("updated_parsed")
                if t:
                    try:
                        pub_date = time.strftime("%Y-%m-%d", t)
                    except:
                        pass
                
                text = fetch_full_article(url)
                if not text:
                    continue
                
                stats["articles_fetched"] += 1
                
                relevance = is_nigeria_related(entry.title, text)
                if relevance is False:
                    continue
                
                if not is_potential_conflict_article(entry.title, text):
                    stats["prefiltered_non_conflict"] += 1
                    continue
                
                if existing_record_fp:
                    try:
                        supabase.table("incidents").delete().eq("content_fp", existing_record_fp).execute()
                        for fp, data in list(recent_incidents_cache.items()):
                            if data.get("content_fp") == existing_record_fp:
                                del recent_incidents_cache[fp]
                    except:
                        pass
                
                stats["ai_processed"] += 1
                ai_response = extract_incident(entry.title, text, pub_date)
                if not ai_response:
                    stats["ai_failed"] += 1
                    continue

                try:
                    data = json.loads(ai_response)
                    incidents_list = data.get("incidents", [])
                except:
                    stats["ai_failed"] += 1
                    continue

                if not incidents_list:
                    continue

                base_article_fp = content_fp(entry.title, text)

                for idx, incident in enumerate(incidents_list):
                    stats["incidents_extracted"] += 1
                    incident = normalize_incident_data(incident)
                    
                    state_val = incident.get("state", "").strip().lower()
                    if state_val not in STATE_MAP:
                        stats["invalid_state_skipped"] += 1
                        continue
                    
                    clean_state = STATE_MAP[state_val]
                    occurrence_date = incident.get("occurrence_date", pub_date)
                    
                    try:
                        fatalities = int(incident.get("fatalities", 0) or 0)
                        abductions = int(incident.get("abductions", 0) or 0)
                    except:
                        fatalities = 0
                        abductions = 0

                    if fatalities == 0 and abductions == 0:
                        stats["no_impact_skipped"] += 1
                        continue

                    clean_lga = incident.get("lga", "Unknown").strip()
                    clean_community = incident.get("community", "Unknown").strip()
                    clean_type = incident.get("incident_type", "Other").strip()
                    current_total = fatalities + abductions
                    
                    sem_fp = semantic_fp(occurrence_date, clean_state, clean_lga, clean_type, fatalities, abductions)
                    
                    if sem_fp in recent_incidents_cache:
                        existing = recent_incidents_cache[sem_fp]
                        existing_total = existing["total_casualties"]
                        should_replace = False
                        
                        if current_total > (existing_total * 1.3):
                            should_replace = True
                        else:
                            existing_source = extract_domain(existing.get("source_url", ""))
                            new_source = extract_domain(url)
                            existing_reliability = SOURCE_RELIABILITY.get(existing_source, 0.5)
                            new_reliability = calculate_report_reliability(url, text, fatalities, abductions)
                            if new_reliability > (existing_reliability + 0.15):
                                should_replace = True
                            elif new_reliability >= 0.7 and existing_reliability >= 0.7 and current_total > existing_total:
                                should_replace = True
                        
                        if should_replace:
                            try:
                                supabase.table("incidents").delete().eq("content_fp", existing["content_fp"]).execute()
                            except:
                                pass
                            recent_incidents_cache[sem_fp]["total_casualties"] = current_total
                            recent_incidents_cache[sem_fp]["source_url"] = url
                            stats["duplicates_overwritten"] += 1
                        else:
                            stats["duplicates_detected"] += 1
                            continue
                    else:
                        recent_incidents_cache[sem_fp] = {
                            "total_casualties": current_total,
                            "content_fp": f"{base_article_fp}_{idx}",
                            "state": clean_state, "lga": clean_lga,
                            "incident_type": clean_type, "date": occurrence_date
def merge_duplicate_records():
    """Merge records with same semantic fingerprint keeping most reliable"""
    if DRY_RUN:
        return
        
    try:
        all_records = supabase.table("incidents")\
            .select("semantic_fp, content_fp, fatalities, abductions, source_url")\
            .order("fatalities", desc=True)\
            .execute()
        
        if not all_records.data:
            return
        
        fp_groups = {}
        for record in all_records.data:
            fp = record.get("semantic_fp")
            if fp:
                if fp not in fp_groups:
                    fp_groups[fp] = []
                fp_groups[fp].append(record)
        
        merged = 0
        for fp, records in fp_groups.items():
            if len(records) > 1:
                def score_record(r):
                    domain = extract_domain(r.get("source_url", ""))
                    reliability = SOURCE_RELIABILITY.get(domain, 0.5)
                    casualties = (r.get("fatalities", 0) or 0) + (r.get("abductions", 0) or 0)
                    return (reliability * 10) + casualties
                
                best = max(records, key=score_record)
                for record in records:
                    if record["content_fp"] != best["content_fp"]:
                        try:
                            supabase.table("incidents").delete().eq("content_fp", record["content_fp"]).execute()
                            merged += 1
                        except:
                            pass
        
        if merged > 0:
            logging.info(f"Merged {merged} duplicate records (kept most reliable)")
    except Exception as e:
        logging.error(f"Merge error: {e}")

# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("=" * 60)
    logging.info("STARTING CONFLICT SCRAPER PIPELINE")
    logging.info(f"DRY_RUN: {DRY_RUN} | Rate Limit: {groq_limiter.max_rpm} RPM")
    logging.info("=" * 60)
    
    cleanup_invalid_records()
    merge_duplicate_records()

    stats = {
        "feeds_processed": 0, "entries_scanned": 0, "articles_fetched": 0,
        "prefiltered_non_conflict": 0, "ai_processed": 0, "incidents_extracted": 0,
        "incidents_saved": 0, "duplicates_detected": 0, "duplicates_overwritten": 0,
        "no_impact_skipped": 0, "invalid_state_skipped": 0, "ai_failed": 0, "url_reprocessed": 0
    }
    
    current_date = datetime.today().strftime("%Y-%m-%d")

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
                
        logging.info(f"Loaded {len(recent_incidents_cache)} recent incidents")
    except Exception as e:
        logging.error(f"Failed to fetch recent incidents: {e}")

    for feed_url in FEEDS:
        stats["feeds_processed"] += 1
        logging.info(f"\nProcessing Feed: {feed_url}")
        
        try:
            feed = feedparser.parse(feed_url)
            
            if not feed.entries:
                logging.warning(f"No entries in feed: {feed_url}")
                continue
            
            current_urls = [normalize_url(e.link) for e in feed.entries if e.get("link")]
            processed_url_map = {}
            
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
                        
                        logging.info(f"Found {len(processed_url_map)} processed URLs")
                        break
                    except Exception as e:
                        logging.warning(f"Batch dedup attempt {attempt+1} failed: {e}")
                        time.sleep(2)
            
            for entry in feed.entries:
                stats["entries_scanned"] += 1
                
                url = normalize_url(entry.link) if entry.get("link") else ""
                if not url:
                    continue
                
                existing_record_fp = None
                
                if url in processed_url_map:
                    existing = processed_url_map[url]
                    existing_casualties = existing["fatalities"] + existing["abductions"]
                    
                    if existing_casualties == 0:
                        logging.info(f"Re-processing URL with 0 casualties: {entry.title[:80]}")
                        stats["url_reprocessed"] += 1
                        existing_record_fp = existing["content_fp"]
                    else:
                        continue
                
                pub_date = current_date
                t = entry.get("published_parsed") or entry.get("updated_parsed")
                if t:
                    try:
                        pub_date = time.strftime("%Y-%m-%d", t)
                    except:
                        pass
                
                logging.info(f"Fetching: {entry.title[:100]}...")
                text = fetch_full_article(url)
                
                if not text:
                    continue
                
                stats["articles_fetched"] += 1
                
                relevance = is_nigeria_related(entry.title, text)
                if relevance is False:
                    continue
                
                if not is_potential_conflict_article(entry.title, text):
                    stats["prefiltered_non_conflict"] += 1
                    continue
                
                if existing_record_fp:
                    try:
                        supabase.table("incidents").delete().eq("content_fp", existing_record_fp).execute()
                        for fp, data in list(recent_incidents_cache.items()):
                            if data.get("content_fp") == existing_record_fp:
                                del recent_incidents_cache[fp]
                    except:
                        pass
                
                logging.info(f"AI processing: {entry.title[:100]}...")
                stats["ai_processed"] += 1
                
                ai_response = extract_incident(entry.title, text, pub_date)
                if not ai_response:
                    stats["ai_failed"] += 1
                    continue

                try:
                    data = json.loads(ai_response)
                    incidents_list = data.get("incidents", [])
                except:
                    stats["ai_failed"] += 1
                    continue

                if not incidents_list:
                    continue

                base_article_fp = content_fp(entry.title, text)

                for idx, incident in enumerate(incidents_list):
                    stats["incidents_extracted"] += 1
                    
                    incident = normalize_incident_data(incident)
                    
                    state_val = incident.get("state", "").strip().lower()
                    if state_val not in STATE_MAP:
                        stats["invalid_state_skipped"] += 1
                        continue
                    
                    clean_state = STATE_MAP[state_val]
                    occurrence_date = incident.get("occurrence_date", pub_date)
                    
                    try:
                        fatalities = int(incident.get("fatalities", 0) or 0)
                        abductions = int(incident.get("abductions", 0) or 0)
                    except:
                        fatalities = 0
                        abductions = 0

                    if fatalities == 0 and abductions == 0:
                        stats["no_impact_skipped"] += 1
                        continue

                    clean_lga = incident.get("lga", "Unknown").strip()
                    clean_community = incident.get("community", "Unknown").strip()
                    clean_type = incident.get("incident_type", "Other").strip()
                    current_total = fatalities + abductions
                    
                    sem_fp = semantic_fp(occurrence_date, clean_state, clean_lga, clean_type, fatalities, abductions)
                    
                    if sem_fp in recent_incidents_cache:
                        existing = recent_incidents_cache[sem_fp]
                        existing_total = existing["total_casualties"]
                        
                        should_replace = False
                        
                        if current_total > (existing_total * 1.3):
                            should_replace = True
                            logging.info(f"Significantly higher casualties ({current_total} vs {existing_total})")
                        else:
                            existing_source = extract_domain(existing.get("source_url", ""))
                            new_source = extract_domain(url)
                            
                            existing_reliability = SOURCE_RELIABILITY.get(existing_source, 0.5)
                            new_reliability = calculate_report_reliability(url, text, fatalities, abductions)
                            
                            if new_reliability > (existing_reliability + 0.15):
                                should_replace = True
                                logging.info(f"More reliable source: {new_source}({new_reliability:.2f}) > {existing_source}({existing_reliability:.2f})")
                            elif new_reliability >= 0.7 and existing_reliability >= 0.7 and current_total > existing_total:
                                should_replace = True
                                logging.info(f"Higher casualties from reliable source")
                        
                        if should_replace:
                            try:
                                supabase.table("incidents").delete().eq("content_fp", existing["content_fp"]).execute()
                            except:
                                pass
                            
                            recent_incidents_cache[sem_fp] = {
                                "total_casualties": current_total,
                                "content_fp": f"{base_article_fp}_{idx}",
                                "state": clean_state,
                                "lga": clean_lga,
                                "incident_type": clean_type,
                                "date": occurrence_date,
                                "source_url": url
                            }
                            stats["duplicates_overwritten"] += 1
                        else:
                            stats["duplicates_detected"] += 1
                            continue
                    else:
                        reliability = calculate_report_reliability(url, text, fatalities, abductions)
                        
                        recent_incidents_cache[sem_fp] = {
                            "total_casualties": current_total,
                            "content_fp": f"{base_article_fp}_{idx}",
                            "state": clean_state,
                            "lga": clean_lga,
                            "incident_type": clean_type,
                            "date": occurrence_date,
                            "source_url": url,
                            "reliability": reliability
                        }
                        
                        logging.info(f"New incident reliability: {reliability:.2f}")
                    
                    unique_content_fp = f"{base_article_fp}_{idx}"

                    payload = {
                        "date": occurrence_date,
                        "state": clean_state,
                        "lga": clean_lga,
                        "community": clean_community,
                        "incident_type": clean_type,
                        "fatalities": fatalities,
                        "abductions": abductions,
                        "summary": incident.get("summary", f"{clean_type} in {clean_community}, {clean_lga} LGA, {clean_state}"),
                        "source_url": url,
                        "content_fp": unique_content_fp,
                        "semantic_fp": sem_fp
                    }

                    try:
                        safe_store(payload)
                        stats["incidents_saved"] += 1
                        logging.info(f"SAVED: {clean_type} in {clean_community}, {clean_state} ({fatalities} dead, {abductions} abducted)")
                    except Exception as ex:
                        logging.error(f"Storage failed: {ex}")
        
        except Exception as e:
            logging.error(f"Error processing feed {feed_url}: {e}")
            continue

    merge_duplicate_records()

    logging.info("\n" + "=" * 60)
    logging.info("PIPELINE COMPLETE")
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
        logging.error(f"Fatal error: {e}")
        raise
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
            logging.info("Lock file removed")
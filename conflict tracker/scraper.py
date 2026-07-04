import os
import sys
import time
import re
import warnings
from dotenv import load_dotenv
import random
import hashlib
import json
import logging
from datetime import datetime, timedelta
from urllib.parse import urlsplit, parse_qsl, urlencode, urlparse
from logging.handlers import RotatingFileHandler

import feedparser
import requests
from bs4 import BeautifulSoup, XMLParsedAsHTMLWarning
from groq import Groq
from supabase import create_client

# Suppress XML parser warning
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

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

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        RotatingFileHandler(os.path.join(LOG_DIR, "scraper.log"), maxBytes=10*1024*1024, backupCount=5)
    ]
)

error_logger = logging.getLogger("errors")
error_logger.setLevel(logging.ERROR)
error_handler = RotatingFileHandler(os.path.join(LOG_DIR, "errors.log"), maxBytes=5*1024*1024, backupCount=3)
error_handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
error_logger.addHandler(error_handler)

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
    def __init__(self, max_rpm=20, max_tpm=5000):
        self.max_rpm = max_rpm
        self.max_tpm = max_tpm
        self.request_timestamps = []
        self.token_usage = []
    
    def wait_if_needed(self, estimated_tokens=1000):
        now = time.time()
        self.request_timestamps = [t for t in self.request_timestamps if now - t < 60]
        self.token_usage = [(t, tokens) for t, tokens in self.token_usage if now - t < 60]
        if len(self.request_timestamps) >= self.max_rpm:
            wait_time = 60 - (now - self.request_timestamps[0]) + 2
            logging.info(f"Rate limit. Waiting {wait_time:.0f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        total_tokens = sum(tokens for _, tokens in self.token_usage)
        if total_tokens + estimated_tokens > self.max_tpm:
            wait_time = 60 - (now - self.token_usage[0][0]) + 2
            logging.info(f"Token limit. Waiting {wait_time:.0f}s...")
            time.sleep(wait_time)
            return self.wait_if_needed(estimated_tokens)
        self.request_timestamps.append(now)
        self.token_usage.append((now, estimated_tokens))
        time.sleep(random.uniform(1.0, 2.0))

groq_limiter = GroqRateLimiter(max_rpm=20)

SOURCE_RELIABILITY = {
    "premiumtimesng.com": 0.90, "punchng.com": 0.85, "dailytrust.com": 0.85,
    "thecable.ng": 0.85, "channelstv.com": 0.80, "vanguardngr.com": 0.75,
}

def extract_domain(url):
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'): domain = domain[4:]
        return domain
    except:
        return ""

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

NIGERIA_TERMS = [
    "nigeria", "abuja", "lagos", "kaduna", "kano", "borno", "plateau",
    "benue", "zamfara", "katsina", "sokoto", "niger", "taraba", "bauchi",
    "rivers", "delta", "edo", "ondo", "osun", "oyo", "enugu", "anambra",
    "imo", "abia", "ebonyi", "cross river", "akwa ibom", "bayelsa",
    "army", "police", "dss", "soldiers", "troops",
    "bandits", "boko haram", "herdsmen", "herders", "cultists", "ipob",
    "iswap", "esn", "unknown gunmen", "militants", "insurgents",
    "kidnap", "kidnapped", "abducted", "hostage", "ransom",
    "killed", "dead", "died", "slain", "massacre",
    "attack", "attacks", "clash", "clashes", "violence",
    "bomb", "explosion", "ambush", "raid", "assault", "shot dead"
]

def normalize_url(url):
    if not url: return ""
    parts = urlsplit(url.lower().strip())
    keep = {"id", "slug", "article", "p"}
    q = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    return parts._replace(query=urlencode(q), fragment="").geturl()

def content_fp(title, text):
    base = f"{title.lower().strip()}::{text[:500].lower().strip()}"
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
    if lga_clean: base += f"|{lga_clean}"
    return hashlib.sha256(base.encode()).hexdigest()

def normalize_incident_data(incident):
    lga = incident.get("lga", "").strip()
    if lga.lower() in LGA_NORMALIZATION:
        incident["lga"] = LGA_NORMALIZATION[lga.lower()]
    elif lga:
        incident["lga"] = lga.title()
    community = incident.get("community", "").strip()
    if community:
        community = community.replace("Village", "").replace("Town", "").strip()
        incident["community"] = community.title() if community else "Unknown"
    for field in ["fatalities", "abductions"]:
        try:
            val = int(incident.get(field, 0))
            if val > 20: incident[field] = round(val / 5) * 5
        except:
            incident[field] = 0
    return incident

def is_potential_conflict_article(title, text):
    """Lenient pre-filter - let AI make final decision"""
    combined = (title + " " + text).lower()
    
    # Quick reject obvious non-conflict
    obvious_non_conflict = [
        "morning recap", "evening recap", "news roundup", "top stories",
        "fashion", "sports", "entertainment", "celebrity", "grammys",
        "appointment", "promotion", "inauguration", "swearing in"
    ]
    for kw in obvious_non_conflict:
        if kw in combined:
            return False
    
    # Quick reject suicide without conflict terms
    if "suicide" in combined or "took his own life" in combined:
        conflict_terms = ["attack", "killed", "gunmen", "bandits", "boko haram"]
        if not any(t in combined for t in conflict_terms):
            return False
    
    return True

def fetch_full_article(url):
    try:
        time.sleep(random.uniform(1, 3))
        r = requests.get(url, headers=CUSTOM_HEADERS, timeout=10)
        r.raise_for_status()
        
        try:
            soup = BeautifulSoup(r.text, "lxml")
        except:
            soup = BeautifulSoup(r.text, "html.parser")
        
        article = soup.find("article")
        if article:
            paras = article.find_all("p")
        else:
            content_div = soup.find("div", class_=["entry-content", "post-content", "article-content", "content"])
            paras = content_div.find_all("p") if content_div else soup.find_all("p")
        
        text = "\n".join(p.get_text().strip() for p in paras if len(p.get_text().strip()) > 30)
        return text[:3000]
    except Exception as e:
        logging.warning(f"Fetch error {url[:80]}: {e}")
        return ""

def nigeria_score(text):
    return sum(1 for t in NIGERIA_TERMS if t in text.lower())

def is_nigeria_related(title, text):
    score = nigeria_score(title + " " + text)
    if score >= 2: return True
    if score >= 1:
        if sum(1 for s in STATE_MAP if s in (title + " " + text).lower()) >= 1:
            return True
    return False

def extract_incident(title, text, article_date, retries=2):
    if not client:
        logging.error("Groq client not initialized.")
        return None
    
    categories_string = '", "'.join(INCIDENT_CATEGORIES)
    
    prompt = f"""Article date: {article_date}.

Extract security incidents from this Nigerian news article.
Return valid JSON only. No markdown.

For each incident, provide: state, lga, community, incident_type, fatalities, abductions, occurrence_date, summary.

INCIDENT TYPES (choose one): {categories_string}

RULES:
- Only extract if there are confirmed fatalities (deaths) OR abductions (kidnappings)
- Report the EXACT numbers mentioned in the article
- If no confirmed casualties, return {{"incidents":[]}}
- For rescue operations, only count NEW deaths during the operation, set abductions=0
- Ignore: suicide, accidents, arrests without casualties, news recaps

EXAMPLES:
Article about attack: {{"incidents":[{{"state":"Kaduna","lga":"Chikun","community":"Kujama","incident_type":"Kidnapping for ransom","fatalities":1,"abductions":14,"occurrence_date":"2026-07-01","summary":"Gunmen attacked village, killing 1, kidnapping 14."}}]}}
Article without casualties: {{"incidents":[]}}

Title: {title}
Text: {text[:2000]}"""
    
    for attempt in range(retries):
        try:
            groq_limiter.wait_if_needed(estimated_tokens=1000)
            res = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=500,
                timeout=30
            )
            result = res.choices[0].message.content
            if result and '"incidents":[]' not in result:
                logging.debug(f"AI found incident: {result[:200]}")
            return result
        except Exception as e:
            err = str(e)
            if "429" in err:
                time.sleep(min(30, 5 * (2 ** attempt)))
            elif "timeout" in err.lower():
                logging.warning(f"API timeout attempt {attempt+1}")
                time.sleep(3)
            elif "401" in err:
                error_logger.error("Invalid API key")
                return None
            else:
                logging.warning(f"API error: {err[:100]}")
                time.sleep(2)
    return None

def safe_store(payload):
    if DRY_RUN:
        logging.info(f"[DRY] {payload.get('state')} - {payload.get('incident_type')} ({payload.get('fatalities')}d/{payload.get('abductions')}a)")
        return {"dry_run": True}
    try:
        existing_url = supabase.table("incidents").select("content_fp, fatalities, abductions").eq("source_url", payload["source_url"]).execute()
        if existing_url.data:
            for r in existing_url.data:
                if payload["fatalities"] + payload["abductions"] >= (r.get("fatalities", 0) or 0) + (r.get("abductions", 0) or 0):
                    supabase.table("incidents").delete().eq("content_fp", r["content_fp"]).execute()
                else:
                    return {"skipped": True}
        existing = supabase.table("incidents").select("content_fp").eq("semantic_fp", payload["semantic_fp"]).execute()
        if existing.data:
            return {"skipped": True}
        return supabase.table("incidents").upsert(payload, on_conflict="semantic_fp").execute()
    except Exception as e:
        error_logger.error(f"Store error: {e}")
        raise

def cleanup_invalid_records():
    if DRY_RUN: return
    try:
        supabase.table("incidents").delete().lt("date", "2026-06-30").execute()
        all_r = supabase.table("incidents").select("content_fp, state").execute()
        if all_r.data:
            for r in all_r.data:
                if (r.get("state") or "").strip().lower() not in STATE_MAP:
                    supabase.table("incidents").delete().eq("content_fp", r["content_fp"]).execute()
    except Exception as e:
        error_logger.error(f"Cleanup error: {e}")

def merge_duplicate_records():
    if DRY_RUN: return
    try:
        all_r = supabase.table("incidents").select("semantic_fp, content_fp, fatalities, abductions, source_url").order("fatalities", desc=True).execute()
        if not all_r.data: return
        groups = {}
        for r in all_r.data:
            fp = r.get("semantic_fp")
            if fp: groups.setdefault(fp, []).append(r)
        merged = 0
        for fp, records in groups.items():
            if len(records) > 1:
                best = max(records, key=lambda r: (SOURCE_RELIABILITY.get(extract_domain(r.get("source_url", "")), 0.5) * 10) + ((r.get("fatalities", 0) or 0) + (r.get("abductions", 0) or 0)))
                for r in records:
                    if r["content_fp"] != best["content_fp"]:
                        supabase.table("incidents").delete().eq("content_fp", r["content_fp"]).execute()
                        merged += 1
        if merged: logging.info(f"Merged {merged} duplicates")
    except Exception as e:
        error_logger.error(f"Merge error: {e}")

def run():
    start_time = time.time()
    logging.info("=" * 50)
    logging.info("CONFLICT SCRAPER STARTING")
    logging.info(f"DRY_RUN: {DRY_RUN} | RPM: {groq_limiter.max_rpm}")
    logging.info("=" * 50)
    
    cleanup_invalid_records()
    merge_duplicate_records()

    stats = {"feeds": 0, "scanned": 0, "fetched": 0, "prefiltered": 0, "ai": 0,
             "extracted": 0, "saved": 0, "duplicates": 0, "overwritten": 0,
             "zero_impact": 0, "bad_state": 0, "ai_fail": 0, "total_dead": 0, "total_kidnapped": 0}
    
    current_date = datetime.today().strftime("%Y-%m-%d")
    cache = {}
    
    try:
        d30 = (datetime.today() - timedelta(days=30)).strftime("%Y-%m-%d")
        res = supabase.table("incidents").select("semantic_fp, content_fp, fatalities, abductions, source_url").gte("date", d30).execute()
        for item in res.data:
            fp = item.get("semantic_fp")
            if fp:
                cache[fp] = {"total": (item.get("fatalities", 0) or 0) + (item.get("abductions", 0) or 0),
                             "content_fp": item.get("content_fp"), "url": item.get("source_url")}
        logging.info(f"Cache: {len(cache)} recent incidents")
    except Exception as e:
        error_logger.error(f"Cache load error: {e}")

    for feed_url in FEEDS:
        stats["feeds"] += 1
        logging.info(f"\nFeed: {extract_domain(feed_url)}")
        try:
            feed = feedparser.parse(feed_url)
            entries = feed.entries[:15] if feed.entries else []
            if not entries:
                logging.info("  No entries")
                continue
            
            urls = [normalize_url(e.link) for e in entries if e.get("link")]
            processed = {}
            if urls:
                try:
                    res = supabase.table("incidents").select("source_url, content_fp, fatalities, abductions").in_("source_url", urls).execute()
                    for x in res.data:
                        u = normalize_url(x.get("source_url", ""))
                        if u:
                            processed[u] = {"fp": x.get("content_fp"), "cas": (x.get("fatalities", 0) or 0) + (x.get("abductions", 0) or 0)}
                except: pass
            
            for entry in entries:
                stats["scanned"] += 1
                url = normalize_url(entry.link) if entry.get("link") else ""
                if not url: continue
                if url in processed and processed[url]["cas"] > 0: continue
                
                pub_date = current_date
                t = entry.get("published_parsed") or entry.get("updated_parsed")
                if t:
                    try: pub_date = time.strftime("%Y-%m-%d", t)
                    except: pass
                
                # Quick title check
                if not is_potential_conflict_article(entry.title, ""):
                    stats["prefiltered"] += 1
                    continue
                
                text = fetch_full_article(url)
                if not text or len(text) < 100: continue
                stats["fetched"] += 1
                
                # Nigeria check - relaxed
                if not is_nigeria_related(entry.title, text):
                    continue
                
                # Full content check
                if not is_potential_conflict_article(entry.title, text):
                    stats["prefiltered"] += 1
                    continue
                
                stats["ai"] += 1
                
                # Debug: log first 3 AI inputs
                if stats["ai"] <= 3:
                    logging.info(f"  AI input: {entry.title[:100]}...")
                    logging.info(f"  Text length: {len(text)} chars")
                
                resp = extract_incident(entry.title, text, pub_date)
                if not resp:
                    stats["ai_fail"] += 1
                    continue
                
                try: data = json.loads(resp)
                except:
                    stats["ai_fail"] += 1
                    logging.warning(f"  JSON parse failed: {resp[:100]}")
                    continue
                
                incidents = data.get("incidents", [])
                if not incidents:
                    continue
                
                for inc in incidents:
                    stats["extracted"] += 1
                    inc = normalize_incident_data(inc)
                    sv = inc.get("state", "").strip().lower()
                    if sv not in STATE_MAP:
                        stats["bad_state"] += 1
                        logging.info(f"  Bad state: {inc.get('state')}")
                        continue
                    cs = STATE_MAP[sv]
                    od = inc.get("occurrence_date", pub_date)
                    try:
                        f = int(inc.get("fatalities", 0) or 0)
                        a = int(inc.get("abductions", 0) or 0)
                    except: f = a = 0
                    if f == 0 and a == 0:
                        stats["zero_impact"] += 1
                        continue
                    
                    cl = inc.get("lga", "Unknown").strip()
                    cc = inc.get("community", "Unknown").strip()
                    ct = inc.get("incident_type", "Other").strip()
                    sem = semantic_fp(od, cs, cl, ct, f, a)
                    
                    if sem in cache and (f + a) <= cache[sem]["total"]:
                        stats["duplicates"] += 1
                        continue
                    
                    if sem in cache:
                        try: supabase.table("incidents").delete().eq("content_fp", cache[sem]["content_fp"]).execute()
                        except: pass
                        stats["overwritten"] += 1
                    
                    cache[sem] = {"total": f + a, "content_fp": f"{content_fp(entry.title, text)}_{stats['extracted']}", "url": url}
                    
                    payload = {"date": od, "state": cs, "lga": cl, "community": cc,
                               "incident_type": ct, "fatalities": f, "abductions": a,
                               "summary": inc.get("summary", f"{ct} in {cc}, {cl}, {cs}"),
                               "source_url": url,
                               "content_fp": f"{content_fp(entry.title, text)}_{stats['extracted']}",
                               "semantic_fp": sem}
                    try:
                        r = safe_store(payload)
                        if r and not r.get("skipped"):
                            stats["saved"] += 1
                            stats["total_dead"] += f
                            stats["total_kidnapped"] += a
                            logging.info(f"  SAVED: {ct} in {cc}, {cs} ({f}d/{a}a)")
                    except: pass
        except Exception as e:
            error_logger.error(f"Feed error {feed_url}: {e}")

    merge_duplicate_records()
    elapsed = time.time() - start_time
    logging.info("\n" + "=" * 50)
    logging.info(f"COMPLETE in {elapsed:.0f}s")
    logging.info(f"Feeds: {stats['feeds']} | Scanned: {stats['scanned']} | Fetched: {stats['fetched']}")
    logging.info(f"AI calls: {stats['ai']} | Saved: {stats['saved']} | Dead: {stats['total_dead']} | Kidnapped: {stats['total_kidnapped']}")
    logging.info(f"Dupes: {stats['duplicates']} | Overwritten: {stats['overwritten']} | Failed: {stats['ai_fail']}")
    logging.info("=" * 50)

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        logging.info("Interrupted")
    except Exception as e:
        error_logger.error(f"Fatal: {e}", exc_info=True)
        raise
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
import os
import sys
import time
import random
import hashlib
import json
import logging
import re
import signal
import threading as _threading
from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit, parse_qsl, urlencode
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
from dotenv import load_dotenv

import feedparser
import requests
from bs4 import BeautifulSoup
from groq import Groq
from supabase import create_client

try:
    import trafilatura
    HAS_TRAFILATURA = True
except ImportError:
    HAS_TRAFILATURA = False

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

local_env  = os.path.abspath(os.path.join(os.path.dirname(__file__), ".env"))
parent_env = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=local_env if os.path.exists(local_env) else parent_env)


# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for verbose output
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# STARTUP VALIDATION
# ─────────────────────────────────────────────────────────────
REQUIRED_ENV = {
    "GROQ_API_KEY": "Groq LLM extraction will not work.",
    "SUPABASE_URL": "Cannot connect to database.",
    "SUPABASE_KEY": "Cannot connect to database.",
}

missing = [k for k in REQUIRED_ENV if not os.environ.get(k)]
if missing:
    for key in missing:
        log.critical(f"Missing required env var: {key}  ->  {REQUIRED_ENV[key]}")
    sys.exit(1)

GROQ_API_KEY = os.environ["GROQ_API_KEY"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
DRY_RUN      = os.environ.get("DRY_RUN", "false").lower() == "true"

groq_client = Groq(api_key=GROQ_API_KEY)
supabase    = create_client(SUPABASE_URL, SUPABASE_KEY)


# ─────────────────────────────────────────────────────────────
# FEEDS
# ─────────────────────────────────────────────────────────────
FEEDS = [
    "https://www.premiumtimesng.com/feed",
    "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/",
    "https://dailytrust.com/feed/",
    "https://www.thecable.ng/feed",
    "https://www.channelstv.com/feed/",
]


# ─────────────────────────────────────────────────────────────
# LOCK FILE  (PID-aware, auto-clears stale locks)
# ─────────────────────────────────────────────────────────────
LOCK_FILE     = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scraper.lock")
MAX_RUN_HOURS = 3


def _acquire_lock() -> bool:
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE) as fh:
                data = json.load(fh)
            pid       = data.get("pid")
            started   = datetime.fromisoformat(data.get("started", ""))
            age_hours = (datetime.now(timezone.utc) - started).total_seconds() / 3600
            if age_hours > MAX_RUN_HOURS:
                log.warning(f"Stale lock (PID {pid}, {age_hours:.1f}h). Clearing.")
            else:
                try:
                    os.kill(pid, 0)
                    log.warning(f"Scraper already running (PID {pid}). Exiting.")
                    return False
                except (ProcessLookupError, PermissionError):
                    log.warning(f"Lock PID {pid} is dead. Clearing.")
        except Exception:
            log.warning("Unreadable lock file. Clearing.")

    with open(LOCK_FILE, "w") as fh:
        json.dump({"pid": os.getpid(), "started": datetime.now(timezone.utc).isoformat()}, fh)
    return True


def _release_lock():
    if os.path.exists(LOCK_FILE):
        os.remove(LOCK_FILE)


def _handle_signal(sig, frame):
    log.warning(f"Signal {sig} received. Releasing lock.")
    _release_lock()
    sys.exit(0)

signal.signal(signal.SIGTERM, _handle_signal)
signal.signal(signal.SIGINT,  _handle_signal)


# ─────────────────────────────────────────────────────────────
# NIGERIAN STATES + ALIASES
# ─────────────────────────────────────────────────────────────
NIGERIAN_STATES = {
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
    "Zamfara", "FCT",
}
STATE_MAP = {s.lower(): s for s in NIGERIAN_STATES}

STATE_ALIASES = {
    "abuja":             "FCT",
    "federal capital":   "FCT",
    "cross river state": "Cross River",
    "akwa ibom state":   "Akwa Ibom",
}


def resolve_state(raw: str):
    val = raw.strip().lower()
    if val in STATE_MAP:
        return STATE_MAP[val]
    for alias, canonical in STATE_ALIASES.items():
        if alias in val:
            return canonical
    return None


# ─────────────────────────────────────────────────────────────
# NIGERIA RELEVANCE FILTER (LESS STRICT)
# ─────────────────────────────────────────────────────────────
_NIGERIA_PATTERNS = [
    re.compile(r"\b" + re.escape(t) + r"\b", re.IGNORECASE) for t in [
        "nigeria", "nigerian", "abuja", "lagos", "kaduna", "kano", "borno", "plateau",
        "army", "police", "dss", "bandits", "banditry", "boko haram", "herdsmen",
        "kidnap", "kidnapped", "kidnapping", "abducted", "abduction", "hostage", "ransom",
    ]
]

MIN_TEXT_LENGTH  = 150
MAX_ARTICLE_CHARS = 1500

# ─────────────────────────────────────────────────────────────
# EVENT LOGGING START DATE
# ─────────────────────────────────────────────────────────────
# Only log incidents that occurred on or after this date
EVENT_START_DATE = datetime(2026, 7, 1, tzinfo=timezone.utc)


def nigeria_score(text: str) -> int:
    return sum(1 for p in _NIGERIA_PATTERNS if p.search(text))


def is_nigeria_relevant(title: str, text: str) -> bool:
    """
    Require 2+ Nigeria markers for relevance (less strict).
    Catches more legitimate Nigerian security articles.
    """
    if len(text) < MIN_TEXT_LENGTH:
        return False
    score = nigeria_score(f"{title} {text}")
    return score >= 2  # Changed from 3 to 2


# ─────────────────────────────────────────────────────────────
# CONFLICT-CASUALTY CLASSIFICATION
# ─────────────────────────────────────────────────────────────
_CONFLICT_KEYWORDS = (
    "attack", "assault", "killing", "killed", "massacre", "slain", "gunmen",
    "bandit", "banditry", "terror", "insurg", "boko", "iswap", "ispwa",
    "clash", "communal", "ethnic", "reprisal", "herdsmen", "herder", "fulani",
    "kidnap", "abduct", "hostage", "ransom", "ambush", "raid", "invasion",
    "shoot", "shooting", "gun", "bomb", "ied", "explos", "suicide",
    "militia", "cult", "cultism", "armed", "violence", "unrest", "riot",
)

_NON_CONFLICT_KEYWORDS = (
    "accident", "crash", "collision", "collapse", "flood", "fire outbreak",
    "stampede", "drown", "electrocut", "lightning", "disease", "cholera",
    "outbreak", "epidemic", "poison", "food poisoning", "suicide bid",
    "childbirth", "capsize", "tanker explosion",
)


def canonical_incident_type(raw: str) -> str:
    """Collapse free-text incident types into a stable set."""
    it = (raw or "").lower().strip()
    if not it:
        return "unknown"
    
    if any(k in it for k in ("kidnap", "abduct", "hostage", "ransom")):
        return "kidnapping"
    if any(k in it for k in ("boko", "iswap", "ispwa", "insurg", "terror")):
        return "terrorism"
    if "bandit" in it:
        return "banditry"
    if any(k in it for k in ("bomb", "ied", "explos", "suicide")):
        return "bombing"
    if any(k in it for k in ("clash", "communal", "ethnic", "reprisal",
                             "herd", "farmer", "cult")):
        return "clash"
    if any(k in it for k in ("attack", "ambush", "raid", "gun", "shoot",
                             "assault", "invasion", "militia", "armed", "killing")):
        return "armed attack"
    return "other"


def is_conflict_casualty(incident_type: str, fatalities: int, abductions: int) -> bool:
    """
    STRICTER: Only log if BOTH conditions hold:
      1. At least one casualty (someone killed OR abducted)
      2. Incident type matches a conflict keyword OR abductions > 0
    """
    fatalities = _safe_int(fatalities)
    abductions = _safe_int(abductions)

    # (1) No casualties -> reject
    if fatalities <= 0 and abductions <= 0:
        log.debug(f"    ❌ No casualties (F:{fatalities}, A:{abductions})")
        return False

    it = (incident_type or "").lower().strip()

    # (2) Explicit non-conflict cause -> reject
    if any(k in it for k in _NON_CONFLICT_KEYWORDS):
        log.debug(f"    ❌ Non-conflict keyword found in: {incident_type}")
        return False

    # (3) Abduction is always conflict; otherwise require a conflict keyword
    if abductions > 0:
        log.debug(f"    ✅ Has abductions ({abductions})")
        return True
    
    has_conflict = any(k in it for k in _CONFLICT_KEYWORDS)
    if has_conflict:
        log.debug(f"    ✅ Has conflict keyword in: {incident_type}")
        return True
    
    log.debug(f"    ❌ No conflict keyword in: {incident_type}")
    return False


# ─────────────────────────────────────────────────────────────
# URL HELPERS
# ─────────────────────────────────────────────────────────────
def normalize_url(url: str) -> str:
    if not url:
        return ""
    parts = urlsplit(url.strip())
    keep  = {"id", "slug", "article", "p"}
    q     = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    cleaned = parts._replace(
        scheme=parts.scheme.lower(),
        netloc=parts.netloc.lower(),
        query=urlencode(q),
        fragment="",
    )
    return cleaned.geturl().rstrip("/")


def _domain_of(url: str) -> str:
    return urlsplit(url).netloc.lower()


# ─────────────────────────────────────────────────────────────
# FINGERPRINTING & DEDUPLICATION
# ─────────────────────────────────────────────────────────────
def content_fp(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _safe_int(val, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _parse_date(date_str) -> datetime | None:
    """
    Parse a date string (YYYY-MM-DD format) and return a timezone-aware datetime.
    All datetimes are in UTC.
    """
    try:
        dt = datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
        # Make timezone-aware (UTC) to be compatible with EVENT_START_DATE
        return dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────
# IMPROVED DEDUPLICATION
# ─────────────────────────────────────────────────────────────
DEDUP_WINDOW_DAYS   = 7
FATALITY_TOLERANCE  = 5
ABDUCTION_TOLERANCE = 10


def casualty_band(n) -> str:
    """Bucket a casualty count to handle reporting variance."""
    n = _safe_int(n)
    if n <= 0:
        return "0"
    if n <= 5:
        return "1-5"
    if n <= 15:
        return "6-15"
    if n <= 50:
        return "16-50"
    return "50+"


def semantic_fp(date_str, state, lga, canonical_type, fatalities, abductions) -> str:
    """
    Creates a stable fingerprint for deduplication across sources.
    """
    state_n = str(state).strip().lower() if state else "unknown"
    lga_n   = str(lga).strip().lower() if lga else ""
    inc_n   = str(canonical_type).strip().lower() if canonical_type else "unknown"

    d = _parse_date(date_str)
    if d:
        bucket = str(d.toordinal() // DEDUP_WINDOW_DAYS)
    else:
        bucket = "unknown"

    base = f"{state_n}|{inc_n}|{casualty_band(fatalities)}|{casualty_band(abductions)}|{bucket}"
    if lga_n:
        base += f"|{lga_n}"
    
    return hashlib.sha256(base.encode()).hexdigest()


def _is_duplicate(sig: dict, recent: list[dict]) -> bool:
    """
    Fuzzy duplicate detection: same real-world event reported by different sources.
    """
    for r in recent:
        # State must match exactly
        if r["state"] != sig["state"]:
            continue
        
        # Incident type must match exactly
        if r["incident_type"] != sig["incident_type"]:
            continue
        
        # LGA must be compatible
        r_lga = (r.get("lga") or "").strip().lower() or None
        s_lga = (sig.get("lga") or "").strip().lower() or None
        if r_lga and s_lga and r_lga != s_lga:
            continue
        
        # Date must be within window
        if r.get("date") is None or sig.get("date") is None:
            continue
        days_diff = abs((r["date"] - sig["date"]).days)
        if days_diff > DEDUP_WINDOW_DAYS:
            continue
        
        # Casualty counts must be within tolerance
        if abs(r.get("fatalities", 0) - sig.get("fatalities", 0)) > FATALITY_TOLERANCE:
            continue
        if abs(r.get("abductions", 0) - sig.get("abductions", 0)) > ABDUCTION_TOLERANCE:
            continue
        
        return True
    
    return False


# ─────────────────────────────────────────────────────────────
# WEB SCRAPING
# ─────────────────────────────────────────────────────────────
CUSTOM_HEADERS = {
    "User-Agent":      ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/124.0.0.0 Safari/537.36"),
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

_domain_last_fetch: dict[str, float] = defaultdict(float)
_MIN_DOMAIN_INTERVAL = 3.0
_domain_locks: dict[str, _threading.Lock] = defaultdict(_threading.Lock)


def fetch_full_article(url: str) -> str:
    domain = _domain_of(url)
    with _domain_locks[domain]:
        elapsed = time.monotonic() - _domain_last_fetch[domain]
        wait    = max(0.0, _MIN_DOMAIN_INTERVAL - elapsed) + random.uniform(0.5, 1.5)
        time.sleep(wait)

    try:
        r = requests.get(url, headers=CUSTOM_HEADERS, timeout=15)
        r.raise_for_status()
        _domain_last_fetch[domain] = time.monotonic()

        if HAS_TRAFILATURA:
            extracted = trafilatura.extract(r.text, include_comments=False, include_tables=False)
            if extracted and len(extracted) >= MIN_TEXT_LENGTH:
                log.debug(f"  ✓ Trafilatura extracted {len(extracted)} chars")
                return extracted[:MAX_ARTICLE_CHARS]

        soup = BeautifulSoup(r.text, "html.parser")
        for selector in ("article", "main", '[class*="article"]', '[class*="content"]'):
            container = soup.select_one(selector)
            if container:
                paras = container.find_all("p")
                text  = "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)
                if len(text) >= MIN_TEXT_LENGTH:
                    log.debug(f"  ✓ BeautifulSoup extracted {len(text)} chars from {selector}")
                    return text[:MAX_ARTICLE_CHARS]

        paras = soup.find_all("p")
        text = "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)[:MAX_ARTICLE_CHARS]
        log.debug(f"  ✓ BeautifulSoup extracted {len(text)} chars (fallback)")
        return text

    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "?"
        log.debug(f"  ❌ HTTP {status} fetching {url[:80]}")
    except Exception as exc:
        log.debug(f"  ❌ Error fetching {url[:80]}: {exc}")
    return ""


# ─────────────────────────────────────────────────────────────
# FOLLOW-UP / AFTERMATH / UPDATE DETECTION
# ─────────────────────────────────────────────────────────────

_AFTERMATH_KEYWORDS = (
    "rescue", "rescued", "rescue operation",
    "release", "released", "freed", "regain freedom", "regained freedom",
    "recover", "recovered", "recovery",
    "escape", "escaped",
    "reunite", "reunited", "reunion",
    "visit", "visits", "visited",
    "condole", "condolence", "sympathize", "sympathy",
    "commiserate", "commiseration",
    "relief", "aid", "donate", "donation",
    "compensation", "compensate", "palliative",
    "investigation", "investigate", "probe",
    "arrest", "arrested", "apprehend", "apprehended",
    "trial", "court", "prosecution", "prosecuted", "charged",
    "sentenced", "convict", "convicted",
    "memorial", "remember", "remembrance", "anniversary",
    "buried", "funeral", "burial", "laid to rest",
    "mass burial",
    "widow", "widows", "survivor", "survivors",
    "orphan", "orphans", "displaced",
    "update on", "update:", "latest on", "days after",
    "weeks after", "months after", "one year after",
    "still missing", "yet to be", "whereabouts",
    "ransom paid", "paid ransom", "ransom demand",
)

_FRESH_INCIDENT_KEYWORDS = (
    "attack", "attacked", "attackers", "attacking",
    "kill", "killed", "killing", "slain",
    "kidnap", "kidnapped", "kidnapping",
    "abduct", "abducted", "abduction",
    "gunmen", "armed men", "assailants",
    "bomb", "bombing", "explosion", "blast",
    "clash", "clashed", "fighting",
    "ambush", "ambushed",
    "raid", "raided", "invasion", "invaded",
    "storm", "stormed",
    "massacre", "massacred",
)


def is_followup_article(title: str, text: str) -> bool:
    """
    Determine if an article is aftermath/follow-up coverage rather than a
    fresh incident report.
    """
    title_lower = (title or "").lower()
    text_lower  = (text or "").lower()
    
    # ── Exception: Don't skip if casualties occurred during rescue ──
    rescue_terms = ("rescue", "rescued", "rescue operation", "freed", "released")
    casualty_indicators = ("kill", "killed", "death", "die", "died", 
                          "wound", "wounded", "casualty", "casualties",
                          "blast", "explosion", "shooting", "gunfire", "crossfire")
    
    has_rescue = any(term in text_lower for term in rescue_terms)
    has_casualties = any(term in text_lower for term in casualty_indicators)
    
    if has_rescue and has_casualties:
        log.debug(f"  ✓ Rescue with casualties exception - allowing LLM to evaluate")
        return False
    
    # ── Rule 1: Aftermath keywords in title = skip ──────────────
    for keyword in _AFTERMATH_KEYWORDS:
        if keyword in title_lower:
            log.debug(f"  ❌ Aftermath keyword in title: '{keyword}'")
            return True
    
    # ── Rule 2: Aftermath signals dominate = skip ───────────────
    aftermath_count = sum(1 for k in _AFTERMATH_KEYWORDS if k in text_lower)
    fresh_count     = sum(1 for k in _FRESH_INCIDENT_KEYWORDS if k in text_lower)
    
    log.debug(f"  Aftermath signals: {aftermath_count}, Fresh signals: {fresh_count}")
    
    if aftermath_count >= 3 and aftermath_count > fresh_count:
        log.debug(f"  ❌ Aftermath signals dominant")
        return True
    
    return False


# ─────────────────────────────────────────────────────────────
# AI INCIDENT EXTRACTION
# ─────────────────────────────────────────────────────────────
_PROMPT_TEMPLATE = """\
The article was published on: {article_date}.

Return ONLY strictly valid JSON. No markdown, no code fences, no preamble.

Extract ONLY conflict-related casualty incidents in Nigeria. A qualifying
incident is an act of organised or armed violence (terrorism, banditry,
insurgency, communal/ethnic/farmer-herder clashes, kidnapping/abduction,
armed attacks, ambushes, bombings) in which people were KILLED or ABDUCTED.

DO NOT extract:
- incidents with zero deaths and zero abductions,
- arrests, rescues, troop deployments, policy/court news with no casualties,
- non-conflict deaths (road accidents, floods, fires, building collapse,
  disease, stampedes).

If the article contains no qualifying incident, return exactly:
{{"incidents": []}}

Otherwise extract every distinct qualifying incident into "incidents".
Each incident MUST contain all of these keys (null if unknown):
  state, lga, community, incident_type, fatalities, abductions,
  occurrence_date (YYYY-MM-DD), summary

Rules:
- fatalities and abductions MUST be integers (0 if none; never words like "several").
- At least one of fatalities or abductions MUST be greater than 0.
- occurrence_date is the actual event date, NOT the article publication date.
- Separate incidents in the same article each get their own object.
- Do not fabricate details absent from the article.

Title: {title}
Text: {text}
"""


_groq_lock = _threading.Lock()
_GROQ_MIN_INTERVAL = 5.0
_groq_last_call: list[float] = [0.0]

_RETRY_AFTER_RE = re.compile(r"try again in\s+([\d.]+)s", re.IGNORECASE)


def _parse_retry_after(err_str: str) -> float | None:
    m = _RETRY_AFTER_RE.search(err_str)
    if m:
        return float(m.group(1)) + 1.0
    return None


def extract_incidents(title: str, text: str, article_date: str, retries: int = 3) -> list[dict]:
    prompt  = _PROMPT_TEMPLATE.format(article_date=article_date, title=title, text=text)
    backoff = 2.0

    for attempt in range(retries):
        with _groq_lock:
            elapsed = time.monotonic() - _groq_last_call[0]
            gap     = _GROQ_MIN_INTERVAL - elapsed
            if gap > 0:
                time.sleep(gap)

            try:
                log.debug(f"  [LLM] Calling Groq API (attempt {attempt + 1})")
                res = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"},
                    temperature=0.1,
                )
                _groq_last_call[0] = time.monotonic()
            except Exception as exc:
                _groq_last_call[0] = time.monotonic()
                err_str       = str(exc)
                is_rate_limit = "rate" in err_str.lower() or "429" in err_str
                if is_rate_limit:
                    retry_after = _parse_retry_after(err_str) or (backoff * 4)
                    log.warning(f"  [LLM] 429 rate limit (attempt {attempt + 1}). "
                                f"Waiting {retry_after:.1f}s")
                    time.sleep(retry_after)
                else:
                    wait = backoff
                    log.warning(f"  [LLM] Error (attempt {attempt + 1}): {str(exc)[:100]}")
                    time.sleep(wait)
                backoff *= 2
                continue

        try:
            raw_response = res.choices[0].message.content
            log.debug(f"  [LLM] Raw response: {raw_response[:300]}")
            data = json.loads(raw_response)
            incidents = data.get("incidents", [])
            log.info(f"  [LLM] ✓ Extracted {len(incidents)} incident(s)")
            return incidents
        except json.JSONDecodeError as exc:
            log.error(f"  [LLM] JSON decode error (attempt {attempt + 1}): {exc}")

    log.error(f"  [LLM] ❌ Extraction failed after {retries} attempts")
    return []


# ─────────────────────────────────────────────────────────────
# DATABASE HELPERS
# ─────────────────────────────────────────────────────────────
def load_processed_article_fps(lookback_days: int = 30) -> set[str]:
    """Load article fingerprints to skip already-processed articles."""
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        res    = supabase.table("incidents").select("content_fp").gte("date", cutoff).execute()
        fps    = set()
        for row in res.data:
            raw = row.get("content_fp", "")
            if raw:
                fps.add(raw.split("_")[0] if "_" in raw else raw)
        log.info(f"Loaded {len(fps)} processed article FPs from last {lookback_days}d")
        return fps
    except Exception as exc:
        log.error(f"Failed to load article FPs: {exc}")
        return set()


def load_recent_incidents(lookback_days: int = 14) -> tuple[set[str], list[dict]]:
    """Load recent incidents for deduplication."""
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        res    = supabase.table("incidents").select(
            "date,state,lga,incident_type,fatalities,abductions,semantic_fp"
        ).gte("date", cutoff).execute()

        fps  = set()
        sigs = []
        for row in res.data or []:
            if row.get("semantic_fp"):
                fps.add(row["semantic_fp"])
            sigs.append({
                "state":         row.get("state"),
                "lga":           (row.get("lga") or "").strip().lower() or None,
                "incident_type": canonical_incident_type(row.get("incident_type")),
                "date":          _parse_date(row.get("date")),
                "fatalities":    _safe_int(row.get("fatalities")),
                "abductions":    _safe_int(row.get("abductions")),
            })
        log.info(f"Loaded {len(fps)} semantic FPs and {len(sigs)} incident sigs from last {lookback_days}d")
        return fps, sigs
    except Exception as exc:
        log.error(f"Failed to load recent incidents: {exc}")
        return set(), []


def safe_store(payload: dict):
    if DRY_RUN:
        log.info(f"[DRY RUN] Would insert: {payload['state']} | {payload['date']} | "
                 f"{payload['incident_type']} | {payload['fatalities']} killed / "
                 f"{payload['abductions']} abducted")
        return
    try:
        supabase.table("incidents").upsert(payload, on_conflict="semantic_fp").execute()
    except Exception as exc:
        log.error(f"DB store error: {exc}")


# ─────────────────────────────────────────────────────────────
# ARTICLE PROCESSOR
# ─────────────────────────────────────────────────────────────
def process_entry(entry, dedup, default_date: str) -> dict:
    """Process a single feed entry."""
    result = {
        "skipped_already_seen":   0,
        "skipped_nigeria":        0,
        "skipped_too_short":      0,
        "skipped_followup":       0,
        "skipped_before_start_date": 0,
        "invalid_state":          0,
        "skipped_no_casualties":  0,
        "semantic_duplicates":    0,
        "ai_failed":              0,
        "saved_incidents":        0,
    }

    try:
        url = normalize_url(entry.get("link", ""))
        if not url:
            return result

        title = (entry.get("title") or "").strip() or "(no title)"

        pub_date = default_date
        t = entry.get("published_parsed") or entry.get("updated_parsed")
        if t:
            try:
                pub_date = time.strftime("%Y-%m-%d", t)
            except Exception:
                pass

        log.info(f"\n[Article] {title[:80]}")
        log.debug(f"  URL: {url[:80]}")
        log.debug(f"  Pub date: {pub_date}")

        # Skip already-processed articles
        art_fp = content_fp(url)
        with dedup["lock"]:
            if art_fp in dedup["article_fps"]:
                log.debug(f"  ❌ Already seen")
                result["skipped_already_seen"] += 1
                return result

        # Fetch article text
        log.debug(f"  Fetching article...")
        text = fetch_full_article(url)
        log.debug(f"  Text length: {len(text)} chars")
        
        if len(text) < MIN_TEXT_LENGTH:
            log.debug(f"  ❌ Too short ({len(text)} < {MIN_TEXT_LENGTH})")
            result["skipped_too_short"] += 1
            return result

        # Nigeria relevance check
        score = nigeria_score(f"{title} {text}")
        log.debug(f"  Nigeria score: {score}")
        
        if not is_nigeria_relevant(title, text):
            log.debug(f"  ❌ Not Nigeria relevant")
            result["skipped_nigeria"] += 1
            return result

        log.debug(f"  ✅ Nigeria relevant")

        # Skip follow-up / aftermath articles
        if is_followup_article(title, text):
            log.info(f"  ❌ Skipping aftermath")
            with dedup["lock"]:
                dedup["article_fps"].add(art_fp)
            result["skipped_followup"] += 1
            return result

        log.debug(f"  ✅ Not aftermath")
        log.info(f"  Processing...")

        # LLM extraction
        incidents_list = extract_incidents(title, text, pub_date)
        if not incidents_list:
            log.info(f"  ❌ LLM extraction returned no incidents")
            result["ai_failed"] += 1
            return result

        log.info(f"  ✅ LLM extracted {len(incidents_list)} incidents")

        # Process each extracted incident
        for idx, incident in enumerate(incidents_list):
            try:
                log.debug(f"  [Incident {idx}]")
                log.debug(f"    Raw incident: {json.dumps(incident, indent=6)}")
                
                # Validate state
                raw_state   = (incident.get("state") or "").strip()
                clean_state = resolve_state(raw_state)
                log.debug(f"    State: {raw_state} → {clean_state}")
                
                if not clean_state:
                    log.debug(f"    ❌ Invalid state")
                    result["invalid_state"] += 1
                    continue

                # Extract casualty numbers
                fatalities  = _safe_int(incident.get("fatalities", 0))
                abductions  = _safe_int(incident.get("abductions", 0))
                raw_type    = (incident.get("incident_type") or "").strip()
                canon_type  = canonical_incident_type(raw_type)
                
                log.debug(f"    Type: {raw_type} → {canon_type}")
                log.debug(f"    Casualties: {fatalities}K / {abductions}A")

                # ══ CONFLICT-CASUALTY GATE ══════════════════════════
                if not is_conflict_casualty(raw_type, fatalities, abductions):
                    log.debug(f"    ❌ Rejected by conflict-casualty gate")
                    result["skipped_no_casualties"] += 1
                    continue

                log.debug(f"    ✅ Passed conflict-casualty gate")

                # Extract location details
                lga = (incident.get("lga") or "").strip() or None

                # Extract date
                raw_date = (incident.get("occurrence_date") or pub_date)[:10]
                if _parse_date(raw_date):
                    occurrence_date = raw_date
                else:
                    occurrence_date = pub_date

                log.debug(f"    Date: {occurrence_date}")

                # ── SKIP INCIDENTS BEFORE START DATE ────────────────
                occurrence_dt = _parse_date(occurrence_date)
                if occurrence_dt and occurrence_dt < EVENT_START_DATE:
                    log.debug(f"    ❌ Before start date ({occurrence_date} < {EVENT_START_DATE.strftime('%Y-%m-%d')})")
                    result["skipped_before_start_date"] += 1
                    continue

                # Create fingerprints
                sem_fp = semantic_fp(
                    occurrence_date, clean_state, lga, canon_type, fatalities, abductions,
                )
                log.debug(f"    Semantic FP: {sem_fp[:16]}...")

                sig = {
                    "state":         clean_state,
                    "lga":           (lga or "").strip().lower() or None,
                    "incident_type": canon_type,
                    "date":          _parse_date(occurrence_date),
                    "fatalities":    fatalities,
                    "abductions":    abductions,
                }

                # ══ DEDUPLICATION ═══════════════════════════════════
                with dedup["lock"]:
                    # Check exact semantic match
                    if sem_fp in dedup["semantic_fps"]:
                        log.debug(f"    ❌ Duplicate (exact FP)")
                        result["semantic_duplicates"] += 1
                        continue
                    
                    # Check fuzzy match
                    if _is_duplicate(sig, dedup["sigs"]):
                        log.debug(f"    ❌ Duplicate (fuzzy)")
                        result["semantic_duplicates"] += 1
                        continue
                    
                    log.debug(f"    ✅ Unique incident")
                    
                    # Mark as processed before DB write
                    dedup["semantic_fps"].add(sem_fp)
                    dedup["sigs"].append(sig)
                    dedup["article_fps"].add(art_fp)

                # Store incident
                payload = {
                    "date":          occurrence_date,
                    "state":         clean_state,
                    "lga":           lga,
                    "community":     (incident.get("community") or "Unknown").strip(),
                    "incident_type": canon_type,
                    "fatalities":    fatalities,
                    "abductions":    abductions,
                    "summary":       (incident.get("summary") or "").strip() or None,
                    "source_url":    url,
                    "content_fp":    f"{art_fp}_{idx}",
                    "semantic_fp":   sem_fp,
                }

                safe_store(payload)
                log.info(f"  ✅ SAVED: {clean_state} | {occurrence_date} | {canon_type} | "
                         f"{fatalities}K / {abductions}A")
                result["saved_incidents"] += 1

            except Exception as exc:
                log.error(f"  ❌ Incident [{idx}] error: {exc}", exc_info=True)

    except Exception as exc:
        log.error(f"process_entry unhandled: {exc}", exc_info=True)

    return result


# ─────────────────────────────────────────────────────────────
# DIAGNOSTIC TEST FUNCTION
# ─────────────────────────────────────────────────────────────
def test_feeds():
    """Test mode: Show feed content."""
    print("\n" + "=" * 80)
    print("  FEED CONTENT TEST")
    print("=" * 80 + "\n")
    
    for feed_url in FEEDS[:2]:
        print(f"Feed: {feed_url}\n")
        f = feedparser.parse(feed_url)
        
        if not f.entries:
            print("  ❌ No entries\n")
            continue
        
        print(f"  Total entries: {len(f.entries)}")
        print(f"  Showing first 5:\n")
        
        for idx, entry in enumerate(f.entries[:5]):
            title = entry.get("title", "?")[:60]
            t = entry.get("published_parsed")
            date_str = time.strftime("%Y-%m-%d", t) if t else "?"
            print(f"    [{idx+1}] [{date_str}] {title}")
        
        print()


# ─────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────
def run():
    log.info("=" * 70)
    log.info("  NIGERIAN SECURITY INCIDENTS SCRAPER")
    log.info(f"  DRY_RUN: {DRY_RUN}  |  trafilatura: {HAS_TRAFILATURA}")
    log.info(f"  Logging incidents from: {EVENT_START_DATE.strftime('%Y-%m-%d')}")
    log.info("=" * 70)

    stats = {
        "feeds":                     0,
        "entries":                   0,
        "skipped_already_seen":      0,
        "skipped_nigeria":           0,
        "skipped_too_short":         0,
        "skipped_followup":          0,
        "skipped_before_start_date": 0,
        "invalid_state":             0,
        "skipped_no_casualties":     0,
        "semantic_duplicates":       0,
        "ai_failed":                 0,
        "saved_incidents":           0,
    }

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Load dedup state
    processed_article_fps        = load_processed_article_fps(lookback_days=30)
    recent_semantic_fps, sigs    = load_recent_incidents(lookback_days=14)

    dedup = {
        "article_fps":  processed_article_fps,
        "semantic_fps": recent_semantic_fps,
        "sigs":         sigs,
        "lock":         _threading.Lock(),
    }

    # Fetch all feed entries
    all_entries = []
    for feed_url in FEEDS:
        stats["feeds"] += 1
        log.info(f"Parsing feed: {feed_url}")
        try:
            f = feedparser.parse(feed_url)
            if f.get("bozo") and f.get("bozo_exception"):
                log.warning(f"Malformed feed: {f.bozo_exception}")
            for entry in f.entries:
                stats["entries"] += 1
                all_entries.append(entry)
        except Exception as exc:
            log.error(f"Feed parse error: {exc}")

    log.info(f"Total entries to evaluate: {len(all_entries)}")
    log.info("")

    # Group by domain for rate limiting
    by_domain: dict[str, list] = defaultdict(list)
    for entry in all_entries:
        domain = _domain_of(normalize_url(entry.get("link", "")))
        if domain:
            by_domain[domain].append(entry)

    # Process entries concurrently
    max_workers = min(len(by_domain) or 1, 6)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_entry, entry, dedup, today)
            for entries in by_domain.values()
            for entry in entries
        ]
        for future in as_completed(futures):
            try:
                for k, v in future.result().items():
                    stats[k] = stats.get(k, 0) + v
            except Exception as exc:
                log.error(f"Future error: {exc}")

    # Report
    log.info("")
    log.info("=" * 70)
    log.info("  EXECUTION REPORT")
    log.info("=" * 70)
    pad = max(len(k) for k in stats) + 2
    for key, val in stats.items():
        name = key.replace('_', ' ').title()
        log.info(f"  {name:<{pad}} {val:>6}")
    log.info("=" * 70)


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_feeds()
        sys.exit(0)
    
    if not _acquire_lock():
        sys.exit(0)
    try:
        run()
    finally:
        _release_lock()
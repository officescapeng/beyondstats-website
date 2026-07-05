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
    level=logging.INFO,
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
# NIGERIA RELEVANCE FILTER  (word-boundary regex)
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


def nigeria_score(text: str) -> int:
    return sum(1 for p in _NIGERIA_PATTERNS if p.search(text))


def is_nigeria_relevant(title: str, text: str):
    """
    STRICTER: Require 3+ Nigeria markers for definitive relevance.
    1-2 markers = reject (too many false positives).
    """
    if len(text) < MIN_TEXT_LENGTH:
        return False
    score = nigeria_score(f"{title} {text}")
    # Changed: Now require score >= 3 to be relevant at all
    return score >= 3


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
    """Collapse free-text incident types into a small, stable set."""
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
    
    This prevents logging arrests, policy news, troop deployments with no deaths.
    """
    fatalities = _safe_int(fatalities)
    abductions = _safe_int(abductions)

    # (1) No casualties -> reject
    if fatalities <= 0 and abductions <= 0:
        return False

    it = (incident_type or "").lower().strip()

    # (2) Explicit non-conflict cause -> reject (accidents, disease, etc.)
    if any(k in it for k in _NON_CONFLICT_KEYWORDS):
        return False

    # (3) Abduction is always conflict; otherwise require a conflict keyword
    if abductions > 0:
        return True
    
    # Must have a conflict keyword if only fatalities
    return any(k in it for k in _CONFLICT_KEYWORDS)


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
    try:
        return datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────
# IMPROVED DEDUPLICATION
# ─────────────────────────────────────────────────────────────
DEDUP_WINDOW_DAYS   = 7     # Incidents within 7 days are likely the same
FATALITY_TOLERANCE  = 5     # Casualty counts within +/- 5 are considered same
ABDUCTION_TOLERANCE = 10    # Abduction counts within +/- 10 are considered same


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
    IMPROVED: Creates a stable fingerprint that catches same events 
    reported by different sources.
    
    Uses:
    - State (must match exactly)
    - Canonical incident type (normalized)
    - Casualty BANDS (not exact counts)
    - Date RANGE (7-day window)
    - LGA if available
    
    This fingerprint MUST match for deduplication to work across sources.
    """
    state_n = str(state).strip().lower() if state else "unknown"
    lga_n   = str(lga).strip().lower() if lga else ""
    inc_n   = str(canonical_type).strip().lower() if canonical_type else "unknown"

    # Use a 7-day bucket so same event reported over days has same FP
    d = _parse_date(date_str)
    if d:
        bucket = str(d.toordinal() // DEDUP_WINDOW_DAYS)
    else:
        bucket = "unknown"

    # Build fingerprint: state + type + casualty bands + date bucket + LGA
    base = f"{state_n}|{inc_n}|{casualty_band(fatalities)}|{casualty_band(abductions)}|{bucket}"
    if lga_n:
        base += f"|{lga_n}"
    
    return hashlib.sha256(base.encode()).hexdigest()


def _is_duplicate(sig: dict, recent: list[dict]) -> bool:
    """
    Fuzzy duplicate detection: same real-world event reported by different sources.
    
    Match criteria (all must pass):
    - Same state
    - Same canonical incident type
    - Same or compatible LGA (both null, or both match)
    - Within 7 days
    - Casualty counts within tolerance
    """
    for r in recent:
        # State must match exactly
        if r["state"] != sig["state"]:
            continue
        
        # Incident type must match exactly (use canonical form)
        if r["incident_type"] != sig["incident_type"]:
            continue
        
        # LGA must be compatible (both unknown, or both the same)
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
        
        # All criteria matched -> it's a duplicate
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
                return extracted[:MAX_ARTICLE_CHARS]

        soup = BeautifulSoup(r.text, "html.parser")
        for selector in ("article", "main", '[class*="article"]', '[class*="content"]'):
            container = soup.select_one(selector)
            if container:
                paras = container.find_all("p")
                text  = "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)
                if len(text) >= MIN_TEXT_LENGTH:
                    return text[:MAX_ARTICLE_CHARS]

        paras = soup.find_all("p")
        return "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)[:MAX_ARTICLE_CHARS]

    except requests.exceptions.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else "?"
        log.debug(f"HTTP {status} fetching {url[:80]}")
    except Exception as exc:
        log.debug(f"Error fetching {url[:80]}: {exc}")
    return ""


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
                    log.warning(f"Groq 429 rate limit (attempt {attempt + 1}). "
                                f"Waiting {retry_after:.1f}s")
                    time.sleep(retry_after)
                else:
                    wait = backoff
                    log.warning(f"Groq error (attempt {attempt + 1}): {str(exc)[:100]}")
                    time.sleep(wait)
                backoff *= 2
                continue

        try:
            data = json.loads(res.choices[0].message.content)
            return data.get("incidents", [])
        except json.JSONDecodeError as exc:
            log.error(f"JSON decode error (attempt {attempt + 1}): {exc}")

    log.error(f"AI extraction failed after {retries} attempts: {title[:60]}")
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
    """
    Load recent incidents for deduplication.
    
    Returns semantic FPs (exact match) and incident signatures (fuzzy match).
    """
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
    """
    Process a single feed entry.
    
    Returns statistics dict.
    """
    result = {
        "skipped_already_seen": 0,
        "skipped_nigeria":      0,
        "skipped_too_short":    0,
        "invalid_state":        0,
        "skipped_no_casualties": 0,
        "semantic_duplicates":  0,
        "ai_failed":            0,
        "saved_incidents":      0,
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

        # Skip already-processed articles
        art_fp = content_fp(url)
        with dedup["lock"]:
            if art_fp in dedup["article_fps"]:
                result["skipped_already_seen"] += 1
                return result

        # Fetch article text
        text = fetch_full_article(url)
        if len(text) < MIN_TEXT_LENGTH:
            result["skipped_too_short"] += 1
            return result

        # Nigeria relevance check (STRICTER now)
        if not is_nigeria_relevant(title, text):
            result["skipped_nigeria"] += 1
            return result

        log.info(f"Processing: {title[:80]} ({len(text)} chars)")

        # LLM extraction
        incidents_list = extract_incidents(title, text, pub_date)
        if not incidents_list:
            result["ai_failed"] += 1
            return result

        # Process each extracted incident
        for idx, incident in enumerate(incidents_list):
            try:
                # Validate state
                raw_state   = (incident.get("state") or "").strip()
                clean_state = resolve_state(raw_state)
                if not clean_state:
                    log.debug(f"  Invalid state: '{raw_state}'")
                    result["invalid_state"] += 1
                    continue

                # Extract casualty numbers
                fatalities  = _safe_int(incident.get("fatalities", 0))
                abductions  = _safe_int(incident.get("abductions", 0))
                raw_type    = (incident.get("incident_type") or "").strip()
                canon_type  = canonical_incident_type(raw_type)

                # ══ CONFLICT-CASUALTY GATE ══════════════════════════
                # CORE FILTER: Only log if it's a real conflict casualty event
                if not is_conflict_casualty(raw_type, fatalities, abductions):
                    log.debug(f"  Not conflict casualty: '{raw_type}', "
                             f"F:{fatalities} A:{abductions}")
                    result["skipped_no_casualties"] += 1
                    continue

                # Extract location details
                lga = (incident.get("lga") or "").strip() or None

                # Extract date
                raw_date = (incident.get("occurrence_date") or pub_date)[:10]
                if _parse_date(raw_date):
                    occurrence_date = raw_date
                else:
                    occurrence_date = pub_date

                # Create fingerprints
                sem_fp = semantic_fp(
                    occurrence_date, clean_state, lga, canon_type, fatalities, abductions,
                )

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
                        log.debug(f"  Duplicate (exact FP): {clean_state} / {canon_type}")
                        result["semantic_duplicates"] += 1
                        continue
                    
                    # Check fuzzy match
                    if _is_duplicate(sig, dedup["sigs"]):
                        log.debug(f"  Duplicate (fuzzy): {clean_state} / {canon_type} / {occurrence_date}")
                        result["semantic_duplicates"] += 1
                        continue
                    
                    # Mark as processed before DB write
                    # (prevents concurrent threads from double-inserting)
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
                log.info(f"  ✓ SAVED: {clean_state} | {occurrence_date} | {canon_type} | "
                         f"{fatalities}K / {abductions}A | {url[:60]}")
                result["saved_incidents"] += 1

            except Exception as exc:
                log.error(f"  Incident [{idx}] error: {exc}", exc_info=False)

    except Exception as exc:
        log.error(f"process_entry unhandled: {exc}", exc_info=False)

    return result


# ─────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────
def run():
    log.info("=" * 60)
    log.info("  SECURITY SCRAPER PIPELINE")
    log.info(f"  DRY_RUN: {DRY_RUN}  |  trafilatura: {HAS_TRAFILATURA}")
    log.info("=" * 60)

    stats = {
        "feeds":                 0,
        "entries":               0,
        "skipped_already_seen":  0,
        "skipped_nigeria":       0,
        "skipped_too_short":     0,
        "invalid_state":         0,
        "skipped_no_casualties": 0,
        "semantic_duplicates":   0,
        "ai_failed":             0,
        "saved_incidents":       0,
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
    log.info("=" * 60)
    log.info("  EXECUTION REPORT")
    log.info("=" * 60)
    pad = max(len(k) for k in stats) + 2
    for key, val in stats.items():
        name = key.replace('_', ' ').title()
        log.info(f"  {name:<{pad}} {val:>6}")
    log.info("=" * 60)


# ─────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not _acquire_lock():
        sys.exit(0)
    try:
        run()
    finally:
        _release_lock()
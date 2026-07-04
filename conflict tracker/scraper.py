import os
import sys
import time
import random
import hashlib
import json
import logging
import re
import signal
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
# ~375 tokens at 4 chars/token — keeps each prompt well under 600 tokens,
# leaving comfortable headroom inside Groq's 6000 TPM limit even with
# multiple concurrent threads.
MAX_ARTICLE_CHARS = 1500


def nigeria_score(text: str) -> int:
    return sum(1 for p in _NIGERIA_PATTERNS if p.search(text))


def is_nigeria_relevant(title: str, text: str):
    if len(text) < MIN_TEXT_LENGTH:
        return False
    score = nigeria_score(f"{title} {text}")
    if score >= 3:
        return True
    if 1 <= score < 3:
        return "borderline"
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
# FINGERPRINTING
# ─────────────────────────────────────────────────────────────
def content_fp(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()


def _safe_int(val, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def semantic_fp(date_str, state, lga, incident_type, fatalities, abductions) -> str:
    """
    Fingerprint for deduplication across outlets reporting the same real-world event.

    Key design decisions:
    - Exact casualty counts (no rounding): prevents merging of distinct events
      with coincidentally similar-but-different tolls.
    - 3-day date bucket: consecutive-day reports of the same event collapse into
      one bucket, catching the common pattern of outlets publishing a day apart.
    - LGA included when present: increases precision, reducing false positives.
    """
    state_n = str(state).strip().lower()         if state         else "unknown"
    lga_n   = str(lga).strip().lower()           if lga           else ""
    inc_n   = str(incident_type).strip().lower() if incident_type else "unknown"
    fat     = _safe_int(fatalities)
    abd     = _safe_int(abductions)

    try:
        d      = datetime.strptime(str(date_str)[:10], "%Y-%m-%d")
        bucket = (d - timedelta(days=d.timetuple().tm_yday % 3)).strftime("%Y-%m-%d")
    except Exception:
        bucket = str(date_str)[:10] if date_str else "unknown"

    base = f"{bucket}|{state_n}|{inc_n}|{fat}|{abd}"
    if lga_n:
        base += f"|{lga_n}"
    return hashlib.sha256(base.encode()).hexdigest()


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

import threading as _threading
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
        log.warning(f"HTTP {status} fetching {url[:80]}")
    except Exception as exc:
        log.warning(f"Error fetching {url[:80]}: {exc}")
    return ""


# ─────────────────────────────────────────────────────────────
# AI INCIDENT EXTRACTION
# ─────────────────────────────────────────────────────────────
_PROMPT_TEMPLATE = """\
The article was published on: {article_date}.

Return ONLY strictly valid JSON. No markdown, no code fences, no preamble.

If the article is NOT about a Nigerian security incident (terrorism, banditry,
clashes, kidnapping, or abductions), return exactly:
{{"incidents": []}}

Otherwise extract every distinct incident into the "incidents" array.
Each incident MUST contain all of these keys (null if unknown):
  state, lga, community, incident_type, fatalities, abductions,
  occurrence_date (YYYY-MM-DD), summary

Rules:
- fatalities and abductions MUST be integers (0 if none; never words like "several").
- occurrence_date is the actual event date, NOT the article publication date.
- Separate incidents in the same article each get their own object.
- Do not fabricate details absent from the article.

Title: {title}
Text: {text}
"""


# Global lock so concurrent threads don't all fire Groq calls simultaneously.
# At ~500 tokens/call and 6000 TPM limit, we can safely do 1 call every ~5s.
_groq_lock = _threading.Lock()
_GROQ_MIN_INTERVAL = 5.0   # seconds between Groq calls (across all threads)
_groq_last_call: list[float] = [0.0]  # mutable container so threads share state

_RETRY_AFTER_RE = re.compile(r"try again in\s+([\d.]+)s", re.IGNORECASE)


def _parse_retry_after(err_str: str) -> float | None:
    """Extract the 'try again in Xs' hint from a Groq 429 error message."""
    m = _RETRY_AFTER_RE.search(err_str)
    if m:
        return float(m.group(1)) + 1.0   # add 1s buffer
    return None


def extract_incidents(title: str, text: str, article_date: str, retries: int = 3) -> list[dict]:
    prompt  = _PROMPT_TEMPLATE.format(article_date=article_date, title=title, text=text)
    backoff = 2.0

    for attempt in range(retries):
        # Throttle: enforce minimum interval between Groq calls globally
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
                                f"Waiting {retry_after:.1f}s as instructed.")
                    time.sleep(retry_after)
                else:
                    wait = backoff
                    log.warning(f"Groq error (attempt {attempt + 1}, wait {wait:.1f}s): {exc}")
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
def load_processed_article_fps(lookback_days: int = 14) -> set[str]:
    """
    Article-level fingerprints already in DB.
    Used to skip the fetch + LLM call entirely for known articles.
    """
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        res    = supabase.table("incidents").select("content_fp").gte("date", cutoff).execute()
        fps    = set()
        for row in res.data:
            raw = row.get("content_fp", "")
            fps.add(raw.split("_")[0] if "_" in raw else raw)
        log.info(f"Loaded {len(fps)} processed article fingerprints (last {lookback_days}d).")
        return fps
    except Exception as exc:
        log.error(f"Failed to load article FPs: {exc}")
        return set()


def load_recent_semantic_fps(lookback_days: int = 7) -> set[str]:
    """Incident-level semantic fingerprints — used to catch cross-outlet duplicates."""
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
        res    = supabase.table("incidents").select("semantic_fp").gte("date", cutoff).execute()
        fps    = {x["semantic_fp"] for x in res.data if x.get("semantic_fp")}
        log.info(f"Loaded {len(fps)} recent semantic fingerprints (last {lookback_days}d).")
        return fps
    except Exception as exc:
        log.error(f"Failed to load semantic FPs: {exc}")
        return set()


def safe_store(payload: dict):
    if DRY_RUN:
        log.info(f"[DRY RUN] Would insert:\n{json.dumps(payload, indent=2)}")
        return
    supabase.table("incidents").upsert(payload, on_conflict="semantic_fp").execute()


# ─────────────────────────────────────────────────────────────
# ARTICLE PROCESSOR
# ─────────────────────────────────────────────────────────────
def process_entry(entry, processed_article_fps: set, recent_semantic_fps: set, default_date: str) -> dict:
    result = {
        "skipped_already_seen": 0,
        "skipped_nigeria":      0,
        "skipped_too_short":    0,
        "invalid_state":        0,
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

        # Skip already-processed articles (saves fetch + LLM call)
        art_fp = content_fp(url)
        if art_fp in processed_article_fps:
            log.debug(f"Already processed: {url[:70]}")
            result["skipped_already_seen"] += 1
            return result

        # Fetch article text
        text = fetch_full_article(url)
        if len(text) < MIN_TEXT_LENGTH:
            log.debug(f"Too short ({len(text)} chars): {url[:70]}")
            result["skipped_too_short"] += 1
            return result

        # Nigeria relevance check
        relevance = is_nigeria_relevant(title, text)
        if relevance is False:
            result["skipped_nigeria"] += 1
            return result

        log.info(f"Processing [{'borderline' if relevance == 'borderline' else 'relevant'}]: {title[:80]}")

        # LLM extraction
        incidents_list = extract_incidents(title, text, pub_date)
        if not incidents_list:
            result["ai_failed" if relevance is True else "skipped_nigeria"] += 1
            return result

        for idx, incident in enumerate(incidents_list):
            try:
                raw_state   = (incident.get("state") or "").strip()
                clean_state = resolve_state(raw_state)
                if not clean_state:
                    log.info(f"  Unknown state '{raw_state}' — skipping.")
                    result["invalid_state"] += 1
                    continue

                fatalities = _safe_int(incident.get("fatalities", 0))
                abductions = _safe_int(incident.get("abductions", 0))
                lga        = (incident.get("lga") or "").strip() or None

                raw_date = (incident.get("occurrence_date") or pub_date)[:10]
                try:
                    datetime.strptime(raw_date, "%Y-%m-%d")
                    occurrence_date = raw_date
                except ValueError:
                    log.warning(f"  Bad date '{raw_date}' — using pub_date.")
                    occurrence_date = pub_date

                sem_fp = semantic_fp(
                    occurrence_date, clean_state, lga,
                    incident.get("incident_type"), fatalities, abductions,
                )

                if sem_fp in recent_semantic_fps:
                    log.info(f"  Semantic duplicate — {clean_state} / {occurrence_date}. Skipping.")
                    result["semantic_duplicates"] += 1
                    continue

                # Register locally before the DB write so concurrent threads don't double-insert
                recent_semantic_fps.add(sem_fp)
                processed_article_fps.add(art_fp)

                payload = {
                    "date":          occurrence_date,
                    "state":         clean_state,
                    "lga":           lga,
                    "community":     (incident.get("community") or "Unknown").strip(),
                    "incident_type": ((incident.get("incident_type") or "").strip().lower()) or None,
                    "fatalities":    fatalities,
                    "abductions":    abductions,
                    "summary":       (incident.get("summary") or "").strip() or None,
                    "source_url":    url,
                    "content_fp":    f"{art_fp}_{idx}",
                    "semantic_fp":   sem_fp,
                }

                safe_store(payload)
                log.info(f"  Saved: {clean_state} | {occurrence_date} | "
                         f"{incident.get('incident_type', '?')} | "
                         f"{fatalities} killed / {abductions} abducted")
                result["saved_incidents"] += 1

            except Exception as exc:
                log.error(f"  Incident [{idx}] error from '{title[:60]}': {exc}", exc_info=True)

    except Exception as exc:
        log.error(f"process_entry unhandled error: {exc}", exc_info=True)

    return result


# ─────────────────────────────────────────────────────────────
# MAIN PIPELINE
# ─────────────────────────────────────────────────────────────
def run():
    log.info("=" * 55)
    log.info("STARTING SECURITY SCRAPER PIPELINE")
    log.info(f"DRY_RUN: {DRY_RUN}  |  trafilatura: {HAS_TRAFILATURA}")
    log.info("=" * 55)

    stats = {
        "feeds":                0,
        "entries":              0,
        "skipped_already_seen": 0,
        "skipped_nigeria":      0,
        "skipped_too_short":    0,
        "invalid_state":        0,
        "semantic_duplicates":  0,
        "ai_failed":            0,
        "saved_incidents":      0,
    }

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    processed_article_fps = load_processed_article_fps(lookback_days=14)
    recent_semantic_fps   = load_recent_semantic_fps(lookback_days=7)

    all_entries = []
    for feed_url in FEEDS:
        stats["feeds"] += 1
        log.info(f"Parsing feed: {feed_url}")
        try:
            f = feedparser.parse(feed_url)
            if f.get("bozo") and f.get("bozo_exception"):
                log.warning(f"Malformed feed ({feed_url}): {f.bozo_exception}")
            for entry in f.entries:
                stats["entries"] += 1
                all_entries.append(entry)
        except Exception as exc:
            log.error(f"Feed parse error {feed_url}: {exc}")

    log.info(f"Total entries to evaluate: {len(all_entries)}")

    # Group by domain so per-domain locks provide natural rate limiting
    by_domain: dict[str, list] = defaultdict(list)
    for entry in all_entries:
        domain = _domain_of(normalize_url(entry.get("link", "")))
        by_domain[domain].append(entry)

    max_workers = min(len(by_domain) or 1, 6)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_entry, entry, processed_article_fps, recent_semantic_fps, today)
            for entries in by_domain.values()
            for entry in entries
        ]
        for future in as_completed(futures):
            try:
                for k, v in future.result().items():
                    stats[k] = stats.get(k, 0) + v
            except Exception as exc:
                log.error(f"Future error: {exc}", exc_info=True)

    log.info("")
    log.info("=" * 45)
    log.info("  PIPELINE EXECUTION REPORT")
    log.info("=" * 45)
    pad = max(len(k) for k in stats) + 2
    for key, val in stats.items():
        log.info(f"  {key.replace('_', ' ').title():<{pad}} {val}")
    log.info("=" * 45)


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

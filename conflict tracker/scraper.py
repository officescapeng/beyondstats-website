import os
import sys
import time
import random
import hashlib
from datetime import datetime
from urllib.parse import urlsplit, parse_qsl, urlencode

import feedparser
import requests
from bs4 import BeautifulSoup
from groq import Groq
from supabase import create_client

# Load environment variables from .env in this folder
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# ---------------- CONFIG ---------------- #

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

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


# ---------------- LOCK ---------------- #

import tempfile, atexit
LOCK_FILE = os.path.join(tempfile.gettempdir(), "scraper.lock")
if os.path.exists(LOCK_FILE):
    print("SCRAPER ALREADY RUNNING")
    exit(0)
open(LOCK_FILE, "w").write("running")
# Ensure lock file is removed on exit
atexit.register(lambda: os.path.exists(LOCK_FILE) and os.remove(LOCK_FILE))


# ---------------- UTIL ---------------- #

def normalize_url(url):
    parts = urlsplit(url.lower().strip())
    keep = {"id", "slug", "article"}
    q = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    return parts._replace(query=urlencode(q)).geturl()


def content_fp(title, text):
    base = f"{title.lower()}::{text[:1000].lower()}"
    return hashlib.sha256(base.encode()).hexdigest()


def semantic_fp(state, fatalities, incident_type):
    base = f"{state}|{fatalities}|{incident_type}".lower()
    return hashlib.sha256(base.encode()).hexdigest()


# ---------------- FETCH ---------------- #

def fetch_full_article(url):
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=10)
        if r.status_code != 200:
            return ""
        soup = BeautifulSoup(r.text, "html.parser")
        paras = soup.find_all("p")
        return "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)[:3000]
    except:
        return ""


# ---------------- NIGERIA FILTER ---------------- #

NIGERIA_TERMS = [
    "nigeria","abuja","lagos","kaduna","kano","borno","plateau",
    "army","police","dss","bandits","boko haram","herdsmen"
]

def nigeria_score(text):
    text = text.lower()
    return sum(1 for t in NIGERIA_TERMS if t in text)


def is_nigeria_related(title, text):
    score = nigeria_score(title + " " + text)
    print("Nigeria score:", score)

    if score >= 3:
        return True
    if 1 <= score < 3:
        return "borderline"
    return False


# ---------------- AI ---------------- #

def extract_incident(title, text):
    prompt = f"""
Return JSON only.

If NOT Nigeria-related:
{{"is_relevant": false}}

Else extract:
state, lga, incident_type, fatalities, abductions, summary

Title: {title}
Text: {text}
"""

    try:
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return res.choices[0].message.content
    except:
        return None


# ---------------- SAFE STORE ---------------- #

def safe_store(payload):
    if DRY_RUN:
        print("[DRY RUN] INSERT:")
        print(payload)
        return {"dry_run": True}
    # Upsert using source_url as conflict key (assuming unique)
    return supabase.table("incidents").upsert(payload, on_conflict="source_url").execute()


# ---------------- MAIN ---------------- #

def run():
    print("STARTING SCRAPER")
    print("DRY_RUN =", DRY_RUN)

    stats = {
        "feeds": 0,
        "entries": 0,
        "saved": 0,
        "skipped_nigeria": 0,
        "ai_failed": 0
    }

    try:
        res = supabase.table("incidents").select("source_url").execute()
        processed = set(x["source_url"] for x in res.data)
    except:
        processed = set()

    for feed in FEEDS:
        stats["feeds"] += 1
        print("\nFEED:", feed)

        f = feedparser.parse(feed)

        for e in f.entries:
            stats["entries"] += 1

            url = e.link
            if url in processed:
                continue

            text = fetch_full_article(url)
            if not text:
                continue

            decision = is_nigeria_related(e.title, text)

            if decision is False:
                stats["skipped_nigeria"] += 1
                continue

            print("PROCESSING:", e.title)

            ai = extract_incident(e.title, text)
            if not ai:
                stats["ai_failed"] += 1
                continue

            import json
            try:
                data = json.loads(ai)
            except:
                stats["ai_failed"] += 1
                continue

            if not data.get("is_relevant"):
                continue

            payload = {
                "date": datetime.today().strftime("%Y-%m-%d"),
                "state": data.get("state"),
                "lga": data.get("lga"),
                "incident_type": data.get("incident_type"),
                "fatalities": data.get("fatalities", 0),
                "abductions": data.get("abductions", 0),
                "summary": data.get("summary"),
                "source_url": e.link
            }

            try:
                safe_store(payload)
                stats["saved"] += 1
                processed.add(url)
                print("SAVED:", e.title)

            except Exception as ex:
                print("DB ERROR:", ex)

    print("\n===== FINAL REPORT =====")
    for k, v in stats.items():
        print(k, ":", v)
    print("========================")


# ---------------- RUN ---------------- #

if __name__ == "__main__":
    try:
        run()
    finally:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)

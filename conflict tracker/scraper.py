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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from social_publisher import publish_to_all_socials
    SOCIAL_PUBLISHING_ENABLED = True
except:
    SOCIAL_PUBLISHING_ENABLED = False
    def publish_to_all_socials(*args, **kwargs):
        pass


# ---------------- CONFIG ---------------- #

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

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

SCRAPE_FROM_DATE = "2026-01-01"


# ---------------- LOCK ---------------- #

LOCK_FILE = "/tmp/conflict_scraper.lock"
if os.path.exists(LOCK_FILE):
    print("SCRAPER ALREADY RUNNING")
    exit(0)
open(LOCK_FILE, "w").write("running")


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


# ---------------- RSS FETCH ---------------- #

def fetch_full_article_text(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        time.sleep(random.uniform(2, 5))
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200:
            return ""
        soup = BeautifulSoup(r.text, "html.parser")
        paras = soup.find_all("p")
        return "\n".join(p.get_text() for p in paras if len(p.get_text()) > 30)[:3000]
    except:
        return ""


# ---------------- NIGERIA DETECTION ---------------- #

NIGERIA_ENTITIES = [
    "nigeria","abuja","lagos","kaduna","kano","borno","plateau",
    "army","police","dss","bandits","boko haram","herdsmen"
]

def nigeria_score(text):
    text = text.lower()
    score = sum(1 for x in NIGERIA_ENTITIES if x in text)
    return score


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


# ---------------- MAIN ---------------- #

def run():
    print("STARTING SCRAPER")

    try:
        res = supabase.table("incidents").select("source_url").execute()
        processed = {normalize_url(x["source_url"]) for x in res.data}
    except:
        processed = set()

    for feed in FEEDS:
        print("\nFEED:", feed)

        f = feedparser.parse(feed)
        print("ENTRIES:", len(f.entries))

        for e in f.entries:
            url = normalize_url(e.link)

            if url in processed:
                print("SKIP DUP URL")
                continue

            text = fetch_full_article_text(e.link)
            if not text:
                continue

            decision = is_nigeria_related(e.title, text)

            if decision is False:
                print("SKIP NON-NIGERIA")
                continue

            if decision == "borderline":
                print("BORDERLINE (still processing)")

            print("PROCESSING:", e.title)

            ai = extract_incident(e.title, text)
            print("AI RESULT:", ai)

            if not ai:
                continue

            try:
                import json
                data = json.loads(ai)
            except:
                continue

            if not data.get("is_relevant"):
                continue

            cfp = content_fp(e.title, text)
            sfp = semantic_fp(
                data.get("state"),
                data.get("fatalities", 0),
                data.get("incident_type")
            )

            payload = {
                "date": datetime.today().strftime("%Y-%m-%d"),
                "state": data.get("state"),
                "lga": data.get("lga"),
                "incident_type": data.get("incident_type"),
                "fatalities": data.get("fatalities", 0),
                "abductions": data.get("abductions", 0),
                "summary": data.get("summary"),
                "source_url": e.link,
                "content_fp": cfp,
                "semantic_fp": sfp
            }

            try:
                supabase.table("incidents").upsert(
                    payload,
                    on_conflict="content_fp"
                ).execute()

                print("SAVED:", e.title)
                processed.add(url)

                publish_to_all_socials(payload["summary"], e.link)

            except Exception as ex:
                print("DB ERROR:", ex)


# ---------------- RUN ---------------- #

if __name__ == "__main__":
    run()
    os.remove(LOCK_FILE)

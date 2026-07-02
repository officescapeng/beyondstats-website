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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
load_dotenv()

# ---------------- LOGGING SETUP ---------------- #
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[logging.StreamHandler(sys.stdout)])

# ---------------- CONFIG & CLIENTS ---------------- #
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
DRY_RUN = os.environ.get("DRY_RUN", "false").lower() == "true"

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------- CONFIG DATA ---------------- #
FEEDS = [
    "https://www.premiumtimesng.com/feed", "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/", "https://dailytrust.com/feed/",
    "https://www.thecable.ng/feed", "https://www.channelstv.com/feed/"
]

NIGERIAN_STATES = {
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Gombe", "Imo", "Jigawa",
    "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
    "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara", "FCT"
}
STATE_MAP = {s.lower(): s for s in NIGERIAN_STATES}

INCIDENT_CATEGORIES = [
    "Banditry", "Armed robbery", "Cult clashes", "Inter-communal clashes",
    "Insurgency (Boko Haram / ISWAP)", "Separatist agitations (IPOB / ESN)",
    "Farmer-herder conflicts", "Kidnapping for ransom", "Ethno-religious clashes",
    "Electoral and political violence", "Extrajudicial killings and state security force enforcement",
    "Mob violence and vigilantism (Jungle justice)", "Resource-control militancy (Oil bunkering and piracy)",
    "Chieftaincy and traditional title tussles", "Boundary and land disputes",
    "Urban gang and street thug violence (Area Boys / Yan Shara)", "Border clashes and transnational crime"
]

# ---------------- UTILITY & AI ---------------- #
def normalize_url(url):
    parts = urlsplit(url.lower().strip())
    keep = {"id", "slug", "article"}
    q = [(k, v) for k, v in parse_qsl(parts.query) if k in keep]
    return parts._replace(query=urlencode(q)).geturl()

def extract_incident(title, text, article_date):
    categories_str = '", "'.join(INCIDENT_CATEGORIES)
    prompt = f"""
    The article was published on: {article_date}.
    Task: Extract Nigerian security incidents.
    Incident Type MUST be one of: ["{categories_str}"].
    If no specific incident or aggregate report, return {{"incidents": []}}.
    Return JSON only.
    Title: {title}
    Text: {text}
    """
    res = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )
    return res.choices[0].message.content

# ---------------- CORE PIPELINE ---------------- #
def run():
    logging.info("STARTING PIPELINE")
    stats = {"saved": 0, "duplicates": 0, "updated": 0}
    
    for feed in FEEDS:
        f = feedparser.parse(feed)
        for e in f.entries:
            text = fetch_full_article(e.link)
            ai_res = extract_incident(e.title, text, datetime.now().strftime("%Y-%m-%d"))
            incidents = json.loads(ai_res).get("incidents", [])
            
            for incident in incidents:
                state_val = incident.get("state", "").strip().lower()
                if state_val not in STATE_MAP: continue
                
                clean_state = STATE_MAP[state_val]
                occurrence_date = incident.get("occurrence_date", datetime.now().strftime("%Y-%m-%d"))
                current_cas = int(incident.get("fatalities", 0)) + int(incident.get("abductions", 0))
                
                # REPRISAL DETECTION
                combined_text = (incident.get("summary", "") + " " + e.title).lower()
                is_new = any(p in combined_text for p in ["reprisal", "revenge", "retaliation", "counter-attack", "again", "another", "follow-up"])
                
                # FUZZY DEDUPE
                if not is_new:
                    two_days = timedelta(days=2)
                    start = (datetime.strptime(occurrence_date, "%Y-%m-%d") - two_days).strftime("%Y-%m-%d")
                    end = (datetime.strptime(occurrence_date, "%Y-%m-%d") + two_days).strftime("%Y-%m-%d")
                    
                    match = supabase.table("incidents").select("id, fatalities, abductions").eq("state", clean_state).eq("lga", incident.get("lga")).gte("date", start).lte("date", end).execute()
                    
                    if match.data:
                        best = match.data[0]
                        if current_cas > (best["fatalities"] + best["abductions"]):
                            supabase.table("incidents").update({"fatalities": incident.get("fatalities"), "abductions": incident.get("abductions")}).eq("id", best["id"]).execute()
                            stats["updated"] += 1
                        continue
                
                # STORAGE
                supabase.table("incidents").insert(incident).execute()
                stats["saved"] += 1

if __name__ == "__main__":
    run()
import os
import sys
import time
import random
from datetime import datetime

# Ensure the script's own directory is on the path so sibling modules
# (social_publisher.py) can be imported when run from the repo root by CI
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import feedparser
import requests
from bs4 import BeautifulSoup
from groq import Groq
from supabase import create_client

# Try social publisher — fail gracefully if not available
try:
    from social_publisher import publish_to_all_socials
    SOCIAL_PUBLISHING_ENABLED = True
except Exception as e:
    print(f"Social publisher unavailable: {e}. Incident scraping will continue without social posting.")
    SOCIAL_PUBLISHING_ENABLED = False
    def publish_to_all_socials(*args, **kwargs):
        pass

# Try loading from local .env file (for local development)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# 1. Configuration & Key Verification
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not (SUPABASE_URL and SUPABASE_KEY):
    print("Error: Missing required database environment variables (SUPABASE_URL, SUPABASE_KEY).")
    exit(1)

if not (GROQ_API_KEY or GEMINI_API_KEY):
    print("Error: Either GROQ_API_KEY or GEMINI_API_KEY must be configured in environment.")
    exit(1)

# Initialize API Clients
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Groq client: {e}")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 2. National Daily News RSS Feeds (6 diverse sources)
FEEDS = [
    "https://www.premiumtimesng.com/feed",
    "https://punchng.com/feed/",
    "https://www.vanguardngr.com/feed/",
    "https://dailytrust.com/feed/",
    "https://www.thecable.ng/feed",
    "https://www.channelstv.com/feed/"
]

def fetch_full_article_text(url):
    """Fetches webpage HTML with exponential backoff for rate limits and extracts paragraphs"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
    }
    
    delay = 5
    max_attempts = 5
    
    for attempt in range(max_attempts):
        try:
            # Throttling: random delay between 5 to 12 seconds to keep scraping stealthy
            sleep_time = random.uniform(5, 12)
            time.sleep(sleep_time)
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                paragraphs = soup.find_all('p')
                text = "\n".join([p.get_text() for p in paragraphs if len(p.get_text()) > 30])
                return text[:2500]
            elif response.status_code == 429:
                wait = delay + random.uniform(1, 5)
                print(f"Publisher rate limited (429) for {url}. Waiting {wait:.1f}s... (Attempt {attempt+1}/{max_attempts})")
                time.sleep(wait)
                delay *= 2
            else:
                print(f"HTTP error {response.status_code} fetching webpage: {url}")
                return ""
        except Exception as e:
            print(f"Network error fetching webpage: {e}")
            time.sleep(2)
    return ""

def extract_incident_with_groq(article_title, article_text):
    """Uses Llama 3.1 8B on Groq to extract structured JSON data from news articles"""
    prompt = f"""
    Analyze the following news article. If it describes a security incident, conflict, clash, banditry attack, 
    kidnapping, or military operation in Nigeria, extract the information into the following JSON format.
    If the article is not about a violent security incident, return an empty JSON object.

    Article Title: {article_title}
    Article Content: {article_text}

    JSON Output Schema:
    {{
      "is_relevant": true/false,
      "state": "Name of the Nigerian state",
      "lga": "Name of the LGA (use null if not specified)",
      "incident_type": "e.g. Banditry, Kidnapping, Communal Clash, Terrorist Attack, Security Force Operation",
      "fatalities": 0, (count of deaths, use 0 if unknown/none)
      "abductions": 0, (count of kidnapped people, use 0 if unknown/none)
      "summary": "1-sentence summary"
    }}
    """
    
    delay = 5
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "limit" in error_str.lower():
                wait = delay + random.uniform(1, 3)
                print(f"Groq Rate limited (429). Waiting {wait:.1f} seconds... (Attempt {attempt+1}/{max_attempts})")
                time.sleep(wait)
                delay *= 2
            else:
                print(f"Error parsing with Groq: {e}")
                return None
    print("Failed to parse article after multiple retries due to Groq rate limits.")
    return None

def extract_incident_with_gemini(article_title, article_text, gemini_key):
    """Uses Gemini 1.5 Flash via REST API to extract structured JSON data from news articles"""
    prompt = f"""
    Analyze the following news article. If it describes a security incident, conflict, clash, banditry attack, 
    kidnapping, or military operation in Nigeria, extract the information into the following JSON format.
    If the article is not about a violent security incident, return an empty JSON object.

    Article Title: {article_title}
    Article Content: {article_text}

    JSON Output Schema:
    {{
      "is_relevant": true/false,
      "state": "Name of the Nigerian state",
      "lga": "Name of the LGA (use null if not specified)",
      "incident_type": "e.g. Banditry, Kidnapping, Communal Clash, Terrorist Attack, Security Force Operation",
      "fatalities": 0, (count of deaths, use 0 if unknown/none)
      "abductions": 0, (count of kidnapped people, use 0 if unknown/none)
      "summary": "1-sentence summary"
    }}
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            if response.status_code == 200:
                res_data = response.json()
                text_response = res_data["candidates"][0]["content"]["parts"][0]["text"]
                # Clean code blocks markdown if present
                if text_response.strip().startswith("```"):
                    lines = text_response.strip().split("\n")
                    if lines[0].startswith("```json"):
                        text_response = "\n".join(lines[1:-1])
                    elif lines[0].startswith("```"):
                        text_response = "\n".join(lines[1:-1])
                import json
                return json.loads(text_response)
            else:
                print(f"Gemini API returned status {response.status_code}: {response.text}")
                time.sleep(2)
        except Exception as e:
            print(f"Gemini API connection error: {e}")
            time.sleep(2)
    return None

def extract_incident(article_title, article_text):
    """Try Groq first (if available), then fall back to Gemini REST API"""
    if GROQ_API_KEY and client:
        try:
            data = extract_incident_with_groq(article_title, article_text)
            if data is not None:
                return data
        except Exception as e:
            print(f"Groq extraction failed: {e}. Falling back to Gemini...")
            
    if GEMINI_API_KEY:
        try:
            data = extract_incident_with_gemini(article_title, article_text, GEMINI_API_KEY)
            if data is not None:
                return data
        except Exception as e:
            print(f"Gemini extraction failed: {e}")
            
    return None

def run_daily_scraper():
    print("Initiating Conflict Tracker Scraper...")
    
    # 1. Fetch already processed URLs from Supabase for local cache pre-filtering
    print("Syncing processed article registry from Supabase...")
    try:
        res = supabase.table("incidents").select("source_url").execute()
        processed_urls = {item["source_url"] for item in res.data if item.get("source_url")}
        print(f"Loaded {len(processed_urls)} already processed article URLs.")
    except Exception as e:
        print(f"Warning: Could not fetch processed URLs from database: {e}")
        processed_urls = set()

    # 2. Iterate and poll feeds
    for feed_url in FEEDS:
        print(f"Polling Feed: {feed_url}")
        feed = feedparser.parse(feed_url)
        
        for entry in feed.entries:
            # De-duplication pre-filter: Skip if already in registry
            if entry.link in processed_urls:
                continue
            
            # Pre-filter keywords to conserve Groq API token usage
            keywords = ["kill", "dead", "clash", "bandit", "abduct", "kidnap", "gunmen", "attack", "army", "operation", "soldier"]
            if any(kw in entry.title.lower() for kw in keywords):
                print(f"Processing incident header: '{entry.title}'")
                
                # Parse date to YYYY-MM-DD
                published_parsed = entry.get('published_parsed') or entry.get('updated_parsed')
                if published_parsed:
                    date_str = time.strftime('%Y-%m-%d', published_parsed)
                else:
                    date_str = datetime.today().strftime('%Y-%m-%d')
                
                # Fetch text summary or description
                text_content = entry.get('summary') or entry.get('description') or ""
                
                # If summary is too short, fetch the full article webpage
                if len(text_content) < 150:
                    print(f"Summary too short ({len(text_content)} chars). Fetching full article webpage...")
                    full_text = fetch_full_article_text(entry.link)
                    if full_text:
                        text_content = full_text
                
                # Extract structured record using AI (Groq with Gemini fallback)
                data = extract_incident(entry.title, text_content)
                
                # Cooldown delay of 2 seconds to respect Groq's 30 Requests Per Minute (RPM) limits
                time.sleep(2)
                
                if data and data.get("is_relevant"):
                    state_name = (data.get("state") or "").strip()
                    try:
                        supabase.table("incidents").insert({
                            "date": date_str,
                            "state": state_name,
                            "lga": data.get("lga"),
                            "incident_type": data["incident_type"],
                            "fatalities": data.get("fatalities", 0),
                            "abductions": data.get("abductions", 0),
                            "source_url": entry.link,
                            "summary": data["summary"]
                        }).execute()
                        print(f"Logged: {data['incident_type']} in {state_name} State ({date_str}).")
                        
                        # Auto-publish details to X, Facebook, and LinkedIn
                        publish_to_all_socials(data["summary"], entry.link)
                        
                        # Add newly processed URL to local cache
                        processed_urls.add(entry.link)
                      
                    except Exception as db_err:
                        print(f"Database insertion failed for {entry.link}: {db_err}")

def poll_and_post_sanity_updates():
    print("\nPolling Sanity CMS for new site posts (Articles & Publications)...")
    sanity_project_id = os.environ.get("VITE_SANITY_PROJECT_ID") or "95kfpzdv"
    sanity_dataset = os.environ.get("VITE_SANITY_DATASET") or "production"
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    registry_file = os.path.join(script_dir, "processed_sanity_posts.json")
    if os.path.exists(registry_file):
        try:
            import json
            with open(registry_file, "r") as f:
                processed_ids = set(json.load(f))
        except Exception:
            processed_ids = set()
    else:
        processed_ids = set()
        
    query = '*[_type in ["article", "publication"]] { _id, _type, title, excerpt, summary }'
    url = f"https://{sanity_project_id}.api.sanity.io/v2021-10-21/data/query/{sanity_dataset}"
    
    try:
        response = requests.get(url, params={"query": query}, timeout=10)
        if response.status_code == 200:
            results = response.json().get("result", [])
            new_posts_found = 0
            
            for doc in results:
                doc_id = doc["_id"]
                if doc_id in processed_ids:
                    continue
                
                title = doc.get("title", "New Update")
                doc_type = doc.get("_type", "post")
                desc = doc.get("excerpt") or doc.get("summary") or ""
                
                # Construct clean post content
                post_title = f"Beyond# {doc_type.capitalize()}: {title}"
                route = f"/publications" if doc_type == "publication" else f"/research"
                post_link = f"https://beyondobservatory.org{route}"
                
                print(f"New Sanity post detected: '{title}' ({doc_id}). Auto-posting...")
                publish_to_all_socials(f"{post_title}\n\n{desc}", post_link)
                
                processed_ids.add(doc_id)
                new_posts_found += 1
                time.sleep(2)
                
            if new_posts_found > 0:
                with open(registry_file, "w") as f:
                    import json
                    json.dump(list(processed_ids), f)
                print(f"Auto-posted {new_posts_found} new Sanity CMS documents.")
            else:
                print("No new Sanity CMS updates found.")
        else:
            print(f"Error querying Sanity API: HTTP {response.status_code}")
    except Exception as e:
        print(f"Sanity polling connection error: {e}")

if __name__ == "__main__":
    run_daily_scraper()
    poll_and_post_sanity_updates()

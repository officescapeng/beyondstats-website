import os
import google.generativeai as genai

# Try loading from local .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY is not configured in .env file.")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

print("Listing models available to your API key:")
try:
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f" - {m.name} (Alias: {m.name.split('/')[-1]})")
except Exception as e:
    print(f"Error querying Model Service: {e}")

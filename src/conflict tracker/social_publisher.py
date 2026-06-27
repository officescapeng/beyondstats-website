import os
import requests

# Try loading from local .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def post_to_x(text):
    """Broadcasts updates to X (Twitter) using Tweepy Client"""
    bearer_token = os.environ.get("X_BEARER_TOKEN")
    consumer_key = os.environ.get("X_API_KEY")
    consumer_secret = os.environ.get("X_API_SECRET")
    access_token = os.environ.get("X_ACCESS_TOKEN")
    access_token_secret = os.environ.get("X_ACCESS_SECRET")
    
    if not all([bearer_token, consumer_key, consumer_secret, access_token, access_token_secret]):
        print("X (Twitter) Auto-Post skipped: Missing credential keys in environment.")
        return None
        
    try:
        import tweepy
        client = tweepy.Client(
            bearer_token=bearer_token,
            consumer_key=consumer_key,
            consumer_secret=consumer_secret,
            access_token=access_token,
            access_token_secret=access_token_secret
        )
        response = client.create_tweet(text=text)
        print("Successfully posted to X (Twitter). ID:", response.data["id"])
        return response.data["id"]
    except ImportError:
        print("X Auto-Post skipped: 'tweepy' module is not installed.")
    except Exception as e:
        print(f"X (Twitter) posting failed: {e}")
    return None

def post_to_facebook(text, link=None):
    """Publishes posts to organization's Facebook Page via Graph API"""
    page_id = os.environ.get("FACEBOOK_PAGE_ID")
    access_token = os.environ.get("FACEBOOK_ACCESS_TOKEN")
    
    if not all([page_id, access_token]):
        print("Facebook Auto-Post skipped: Missing page ID or access token.")
        return None
        
    url = f"https://graph.facebook.com/{page_id}/feed"
    params = {
        "message": text,
        "access_token": access_token
    }
    if link:
        params["link"] = link
        
    try:
        response = requests.post(url, params=params, timeout=10)
        res_data = response.json()
        if "id" in res_data:
            print("Successfully posted to Facebook Page. ID:", res_data["id"])
            return res_data["id"]
        else:
            print("Facebook posting failed:", res_data.get("error", {}).get("message"))
    except Exception as e:
        print(f"Facebook connection failed: {e}")
    return None

def post_to_linkedin(text, article_url=None):
    """Broadcasts updates to LinkedIn via UGC Posts REST API"""
    access_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    author_urn = os.environ.get("LINKEDIN_AUTHOR_URN")
    
    if not all([access_token, author_urn]):
        print("LinkedIn Auto-Post skipped: Missing author URN or access token.")
        return None
        
    url = "https://api.linkedin.com/v2/ugcPosts"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    
    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": text
                },
                "shareMediaCategory": "ARTICLE" if article_url else "NONE",
                "media": [
                    {
                        "status": "READY",
                        "originalUrl": article_url
                    }
                ] if article_url else []
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        res_data = response.json()
        if "id" in res_data:
            print("Successfully posted to LinkedIn. ID:", res_data["id"])
            return res_data["id"]
        else:
            print("LinkedIn posting failed:", res_data.get("message"))
    except Exception as e:
        print(f"LinkedIn connection failed: {e}")
    return None

def post_to_instagram(image_url, caption):
    """Uploads and publishes photo posts to Instagram Business via Graph API"""
    instagram_account_id = os.environ.get("INSTAGRAM_ACCOUNT_ID")
    access_token = os.environ.get("INSTAGRAM_ACCESS_TOKEN")
    
    if not all([instagram_account_id, access_token, image_url]):
        print("Instagram Auto-Post skipped: Missing account ID, access token or media URL.")
        return None
        
    try:
        # Step 1: Create media container
        container_url = f"https://graph.facebook.com/v18.0/{instagram_account_id}/media"
        container_params = {
            "image_url": image_url,
            "caption": caption,
            "access_token": access_token
        }
        container_res = requests.post(container_url, params=container_params, timeout=10)
        creation_id = container_res.json().get("id")
        
        if not creation_id:
            print("Instagram media container creation failed:", container_res.json().get("error", {}).get("message"))
            return None
            
        # Step 2: Publish media container
        publish_url = f"https://graph.facebook.com/v18.0/{instagram_account_id}/media_publish"
        publish_params = {
            "creation_id": creation_id,
            "access_token": access_token
        }
        publish_res = requests.post(publish_url, params=publish_params, timeout=10)
        pub_id = publish_res.json().get("id")
        
        if pub_id:
            print("Successfully posted to Instagram. ID:", pub_id)
            return pub_id
        else:
            print("Instagram publishing failed:", publish_res.json().get("error", {}).get("message"))
    except Exception as e:
        print(f"Instagram connection failed: {e}")
    return None

def publish_to_all_socials(summary, link=None, image_url=None):
    """Dispatches posts across X, Facebook, LinkedIn, and Instagram in parallel"""
    print(f"Broadcasting update to social networks: '{summary[:50]}...'")
    
    # Construct default post text combining the summary and link
    post_text = f"Beyond# Conflict Alert: {summary}"
    if link:
        post_text += f"\n\nRead full report: {link}"
        
    # Execute calls inside try-except scopes so one failing channel doesn't block the others
    post_to_x(post_text)
    post_to_facebook(summary, link)
    post_to_linkedin(summary, link)
    
    if image_url:
        post_to_instagram(image_url, post_text)

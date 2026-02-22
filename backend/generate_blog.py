#!/usr/bin/env python3
"""
Automated Blog Post Generator for MyPropOps
Runs on Monday, Thursday, and Sunday to generate new blog content.

Usage:
1. Set up as a cron job: 
   0 9 * * 0,1,4 /path/to/generate_blog.py

2. Or call the API endpoint:
   curl -X POST https://mypropops.com/api/blog/schedule-generation
"""

import asyncio
import os
import sys
from datetime import datetime, timezone

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

async def generate_blog_if_scheduled():
    """Check if today is a publish day and generate a blog post."""
    today = datetime.now(timezone.utc)
    day_of_week = today.weekday()  # 0=Monday, 1=Tuesday, ..., 6=Sunday
    
    # Publish on Monday (0), Thursday (3), Sunday (6)
    publish_days = {0: "Monday", 3: "Thursday", 6: "Sunday"}
    
    if day_of_week not in publish_days:
        print(f"Today is {today.strftime('%A')} - not a publish day. Skipping.")
        return
    
    print(f"Today is {publish_days[day_of_week]} - generating blog post...")
    
    # Import here to avoid loading everything when not needed
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    from motor.motor_asyncio import AsyncIOMotorClient
    import uuid
    import random
    
    # Load environment
    from dotenv import load_dotenv
    load_dotenv()
    
    # Connect to DB
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME')]
    
    # Check if already published today
    today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.blog_posts.find_one({
        "published_at": {"$gte": today_start.isoformat()},
        "auto_generated": True
    })
    
    if existing:
        print(f"Already published today: {existing.get('title')}")
        return
    
    # Topics pool
    topics = [
        "5 Tips for Screening Tenants Like a Pro",
        "How to Handle Late Rent Payments Without Losing Tenants",
        "The Complete Guide to Property Inspections",
        "Maximizing Rental Income: Strategies That Actually Work",
        "Dealing with Difficult Tenants: A Landlord's Guide",
        "Understanding Fair Housing Laws: What Every Landlord Must Know",
        "Maintenance Requests: How to Prioritize and Save Money",
        "Building a Strong Landlord-Tenant Relationship",
        "The Future of Property Management: AI and Automation",
        "Section 8 Housing: Pros, Cons, and Best Practices",
        "How to Set the Right Rent Price for Your Property",
        "Eviction Process: A Step-by-Step Legal Guide",
        "Property Management Software: What to Look For",
        "Tax Deductions Every Landlord Should Know",
        "Emergency Repairs: When to Act and When to Wait",
        "How to Market Your Rental Property Effectively",
        "Lease Agreement Essentials: What to Include",
        "Property Security Tips for Landlords",
        "Managing Multiple Properties: Best Practices",
        "Seasonal Maintenance Checklist for Property Managers"
    ]
    
    # Get existing titles to avoid duplicates
    existing_titles = await db.blog_posts.distinct("title")
    available_topics = [t for t in topics if t not in existing_titles]
    
    if not available_topics:
        print("All topics have been used. Consider adding new ones.")
        available_topics = topics  # Reuse if needed
    
    topic = random.choice(available_topics)
    categories = ["Property Management", "Landlord Tips", "Industry News"]
    category = random.choice(categories)
    
    system_message = """You are a professional blog writer for MyPropOps, a property management software company. 
    Write engaging, actionable content for landlords and property managers."""
    
    prompt = f"""Write a professional blog post about: "{topic}"

The blog should be:
- 800-1200 words
- Written in a friendly, professional tone
- Include practical tips and examples
- Use subheadings (format as <h2> tags)
- End with a call-to-action mentioning MyPropOps

Format as HTML with <p>, <h2>, <ul><li> tags.

Start with:
Title: [your title]
Excerpt: [2-3 sentence summary]
Read time: [minutes]

Then the HTML content."""

    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"blog-{datetime.now().timestamp()}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        response_text = await chat.send_message(UserMessage(text=prompt))
        
        # Parse response
        lines = response_text.split('\n')
        title = topic
        excerpt = ""
        read_time = 5
        content_start = 0
        
        for i, line in enumerate(lines):
            if line.lower().startswith('title:'):
                title = line.split(':', 1)[1].strip()
            elif line.lower().startswith('excerpt:'):
                excerpt = line.split(':', 1)[1].strip()
            elif line.lower().startswith('read time:'):
                try:
                    read_time = int(''.join(filter(str.isdigit, line)))
                except:
                    read_time = 5
            elif '<' in line:
                content_start = i
                break
        
        content = '\n'.join(lines[content_start:])
        if not excerpt:
            excerpt = topic
        
        # Create slug
        slug = title.lower()
        slug = ''.join(c if c.isalnum() or c == ' ' else '' for c in slug)
        slug = slug.replace(' ', '-')[:50]
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
        
        post = {
            "id": str(uuid.uuid4()),
            "slug": slug,
            "title": title,
            "excerpt": excerpt,
            "content": content,
            "category": category,
            "read_time": read_time,
            "image_url": None,
            "status": "published",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auto_generated": True
        }
        
        await db.blog_posts.insert_one(post)
        print(f"SUCCESS: Published '{title}'")
        print(f"URL: /blog/{slug}")
        
    except Exception as e:
        print(f"ERROR: Failed to generate blog post: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(generate_blog_if_scheduled())

import httpx

BASE_URL = "https://my-app-mvp.onrender.com"

# Step 1: Root check
resp = httpx.get(f"{BASE_URL}/")
print("Root:", resp.status_code, resp.json())

# Step 2: Health check
resp = httpx.get(f"{BASE_URL}/health")
print("Health:", resp.status_code, resp.json())

# Step 3: Languages
resp = httpx.get(f"{BASE_URL}/languages")
print("Languages:", resp.status_code, resp.json())

# Step 4: Single Translation
data = {"text": "How are you?", "target_lang": "fr"}
resp = httpx.post(f"{BASE_URL}/translate", json=data)
print("Translate:", resp.status_code, resp.json())

# Step 5 (Day 6): Multiple Chat Messages Simulation
chat_messages = [
    {"text": "Good morning", "target_lang": "fr"},
    {"text": "How are you?", "target_lang": "es"},
    {"text": "Let’s join the meeting", "target_lang": "de"},
]

print("\nSimulated Chat Translations:")
for msg in chat_messages:
    resp = httpx.post(f"{BASE_URL}/translate", json=msg)
    print(f"Original: {msg['text']} -> {resp.json()['translated_text']}")

# Step 6 (Day 7): Error handling test (empty text)
bad_data = {"text": "   ", "target_lang": "es"}
resp = httpx.post(f"{BASE_URL}/translate", json=bad_data)
print("\nError Test (empty text):", resp.status_code, resp.json())

import httpx

API_URL = "http://127.0.0.1:8000/translate"  # later replace with ngrok URL

data = {
    "text": "How are you?",
    "target_lang": "fr"
}

response = httpx.post(API_URL, json=data)

print("Status Code:", response.status_code)
print("Response:", response.json())

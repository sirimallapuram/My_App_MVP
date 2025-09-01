from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI(title="Mock Translation API")

# Allow frontend apps to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:3000"] if React is running there
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request body model
class TranslationRequest(BaseModel):
    text: str
    target_lang: str

# Root endpoint
@app.get("/")
def root():
    return {"message": "Translation API is running"}

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Available languages endpoint
@app.get("/languages")
def get_languages():
    return {
        "languages": ["en", "es", "fr", "de", "hi", "ta", "te", "zh", "ja"]
    }

# Mock translation endpoint
@app.post("/translate")
def translate(req: TranslationRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    return {
        "original_text": req.text,
        "target_lang": req.target_lang,
        "translated_text": f"{req.text} [{req.target_lang}]"
    }

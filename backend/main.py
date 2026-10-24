import os
from typing import Annotated

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Food Verse AI API", version="1.0.0")
frontend_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        *frontend_origins,
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_IMAGE_SIZE = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_configured_api_key = os.getenv("FOODVERSE_API_KEY")


class CookingRequest(BaseModel):
    ingredients: str = Field(min_length=1, max_length=1000)


class NutritionRequest(BaseModel):
    preferences: str = Field(min_length=1, max_length=1000)
    dietary_restrictions: str = Field(default="", max_length=500)


async def validate_image(image: UploadFile) -> None:
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, WEBP, or GIF image.")
    contents = await image.read(MAX_IMAGE_SIZE + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="The image must be 10 MB or smaller.")
    await image.close()


@app.get("/api/health")
async def health():
    return {"status": "ok", "mode": "demo"}


@app.post("/api/scanner")
async def scan_food(image: Annotated[UploadFile, File()]):
    await validate_image(image)
    return {
        "title": "Vegetable grain bowl",
        "summary": "A colorful bowl with grains and fresh vegetables (sample prediction).",
        "nutrition": {"Calories": "420 kcal", "Protein": "16 g", "Carbs": "58 g", "Fat": "14 g"},
        "note": "Illustrative estimate only. An uploaded image is not analyzed in demo mode.",
    }


@app.post("/api/freshness")
async def check_freshness(image: Annotated[UploadFile, File()]):
    await validate_image(image)
    return {
        "title": "Freshness cues to look for",
        "summary": "Sample guidance only; this result is not based on the uploaded image.",
        "indicators": [
            "Look for natural, even color and firm texture.",
            "Avoid food with mold, unusual sliminess, or an off smell.",
            "When uncertain, check storage dates and discard questionable food.",
        ],
        "note": "A photo cannot confirm food safety. Do not taste food to test it.",
    }


@app.post("/api/hygiene")
async def check_hygiene(image: Annotated[UploadFile, File()]):
    await validate_image(image)
    return {
        "title": "Clean preparation checklist",
        "summary": "Sample reminders only; this result does not inspect the uploaded image.",
        "indicators": [
            "Keep raw and ready-to-eat foods on separate surfaces.",
            "Wash hands, utensils, and worktops before preparing food.",
            "Store perishable ingredients promptly at a safe temperature.",
        ],
        "note": "This demo cannot identify contamination or determine whether food is safe.",
    }


@app.post("/api/cooking")
async def suggest_recipe(payload: CookingRequest):
    ingredients = [item.strip() for item in payload.ingredients.split(",") if item.strip()]
    if not ingredients:
        raise HTTPException(status_code=422, detail="Enter ingredients separated by commas.")
    if len(ingredients) > 30:
        raise HTTPException(status_code=422, detail="Please enter 30 ingredients or fewer.")
    ingredient_text = ", ".join(ingredients[:6])
    return {
        "title": "Quick ingredient skillet",
        "summary": f"Demo recipe using {ingredient_text}. Warm a pan, cook sturdy ingredients first, add softer ingredients near the end, season to taste, and serve warm.",
        "indicators": ["Prep and chop your ingredients.", "Cook in a lightly oiled pan until tender and hot.", "Taste, season, and serve."],
        "note": "Sample recipe idea. Adjust cooking times to suit each ingredient.",
    }


@app.post("/api/nutrition")
async def create_meal_plan(payload: NutritionRequest):
    preference = payload.dietary_restrictions.strip() or payload.preferences.strip()
    return {
        "title": "A simple one-day meal plan",
        "summary": f"Demo plan tailored around: {preference}.",
        "indicators": [
            "Breakfast — Oatmeal with fruit and seeds.",
            "Lunch — Grain bowl with vegetables and a protein of your choice.",
            "Snack — Fruit with yogurt or a suitable alternative.",
            "Dinner — Vegetable soup with whole-grain toast.",
        ],
        "note": "General inspiration, not personalized medical or dietetic advice. Check ingredients for your dietary needs.",
    }

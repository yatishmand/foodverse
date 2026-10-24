# Food Verse AI

A minimal, responsive college assignment project with a React + Vite frontend and a Python + FastAPI backend. It runs locally and can be deployed to Render without Docker, API keys, Supabase, or an external AI service.

> **Demo mode:** All five tools return clearly labelled sample data. Food images are validated as uploads but are not analyzed. Nutrition values and food guidance are illustrative and should not be used for medical or food-safety decisions.

## Requirements

- Windows 10 or 11
- Node.js 18+ (includes npm)
- Python 3.10+

## Setup on Windows

Open two PowerShell terminals in the project folder.

### 1. Start the backend

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

These commands use the virtual environment's Python directly, so PowerShell does not need to run the blocked `Activate.ps1` script. Leave this terminal open while using the app.

The API is at `http://127.0.0.1:8000`; interactive API documentation is at `http://127.0.0.1:8000/docs`.

### 2. Start the frontend

In another PowerShell terminal, from the project folder:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Using `npm.cmd` avoids PowerShell's script-execution restriction on the `npm.ps1` shim; there is no need to change your execution policy for npm.

Open the local URL printed by Vite (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to the backend.

## Deploy to Render

The root-level `render.yaml` defines two free Render services: a FastAPI web service and a Vite static site. Render builds the frontend with the backend URL configured automatically.

1. Push the project to a GitHub repository.
2. In the [Render Dashboard](https://dashboard.render.com), choose **New > Blueprint** and connect that repository.
3. Review the two services from `render.yaml` and deploy the Blueprint.
4. After the frontend's first deployment, copy its `https://...onrender.com` URL from the Render Dashboard.
5. Open the **food-verse-api** service's **Environment** settings. Set `FRONTEND_ORIGINS` to the exact frontend URL (scheme included, with no trailing slash), save, and let the backend redeploy. Local development origins remain enabled.
6. Open the frontend's Render URL and test the tools. The API health endpoint is available at `<backend-url>/api/health`.

Render free web services may spin down after inactivity, so the first API request after a quiet period can take longer. The API key placeholder in `backend/.env` is not needed for this demo; configure any future provider key in the backend service's Render environment, not in the frontend.

## Features

- **Food Scanner:** upload an image and see a sample food label with illustrative nutrition.
- **Freshness Checker:** upload an image and see general visual freshness reminders.
- **Cooking Assistant:** enter comma-separated ingredients for a demo recipe suggestion.
- **Nutrition Planner:** enter goals or preferences and optional dietary restrictions for a sample one-day plan.
- **Hygiene Monitor:** upload an image and see general food-preparation cleanliness reminders.

Image tools accept JPG, PNG, WEBP, and GIF up to 10 MB. Their sample responses do not inspect image contents. The backend API key placeholder lives in `backend/.env`; no provider integration currently reads or needs it. Keep real credentials server-side if an AI provider is added later.

## Production build

```powershell
cd frontend
npm.cmd run build
```

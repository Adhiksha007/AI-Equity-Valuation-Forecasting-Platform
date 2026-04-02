"""
main.py — FastAPI application entry point.
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.models import initialize_database
from routers import analyze, export

app = FastAPI(
    title="AI Equity Valuation API",
    description="FastAPI backend for the AI Stock Valuation & Forecasting Platform",
    version="1.0.0",
)

# Allow the Vite dev server to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise SQLite tables on startup
@app.on_event("startup")
def startup():
    initialize_database()

# Routers
app.include_router(analyze.router, prefix="/api")
app.include_router(export.router,  prefix="/api")

@app.get("/")
def root():
    return {"message": "AI Equity Valuation API is running."}

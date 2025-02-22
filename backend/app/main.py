from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.base_router import router as base_router

app = FastAPI(title="DataExtractorMachine3000")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Для Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(base_router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.base_router import router as base_router
from app.autoReport.reportGenerator import router as report_router  # Добавил новый роутер

app = FastAPI(title="My FastAPI Project")

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
app.include_router(report_router)  # Подключаем эндпоинты из reportGenerator.py

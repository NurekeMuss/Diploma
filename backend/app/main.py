from fastapi import FastAPI
from app.routers.base_router import router as base_router

app = FastAPI(title="My FastAPI Project")

app.include_router(base_router)


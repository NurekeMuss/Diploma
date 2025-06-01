from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.base_router import router as base_router
from app.auth.auth_router import router as auth_router

app = FastAPI(title="DataExtractorMachine3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(base_router)
app.include_router(auth_router)
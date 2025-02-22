from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.base_router import router as base_router

app = FastAPI(title="My FastAPI Project")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Allows the Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(base_router)
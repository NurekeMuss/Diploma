from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def read_base():
    return {"message": "This is the base router"}
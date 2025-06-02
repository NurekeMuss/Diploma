from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import HTMLResponse
from .schemas import UserRegister, UserLogin, UserProfile, UserProfileUpdate
from .models import (
    get_user_by_email,
    create_user,
    verify_password,
    get_user_by_id,
    get_profile_by_user_id,
    update_profile,
    update_password,
    user_collection,
)
from .utils import (
    create_access_token,
    decode_token,
    hash_password,
    create_verification_token,
    send_verification_email,
    verify_verification_token,
)

router = APIRouter(prefix="/auth", tags=["Auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register")
async def register(user: UserRegister):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = user.dict()
    user_data["password"] = hash_password(user_data["password"])
    new_user = await create_user(user_data)

    # Generate token and send email
    verification_token = create_verification_token(str(new_user["_id"]))
    await send_verification_email(new_user["email"], verification_token)

    return {
        "message": "Registration successful. Please check your email to verify your account."
    }


@router.post("/login")
async def login(user: UserLogin):
    db_user = await get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # if not db_user.get("is_verified"):
    #     raise HTTPException(
    #         status_code=403, detail="Please verify your email before logging in."
    #     )

    token = create_access_token({"user_id": str(db_user["_id"])})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/profile", response_model=UserProfile)
async def get_profile(token: str = Depends(oauth2_scheme)):
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await get_user_by_id(user_id)
    profile = await get_profile_by_user_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfile(
        name=user["full_name"],
        email=user["email"],
        phone=profile.get("phone"),
        bio=profile.get("bio"),
    )


@router.put("/profile")
async def update_user_profile(
    data: UserProfileUpdate, token: str = Depends(oauth2_scheme)
):
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    if data.new_password:
        hashed_pw = hash_password(data.new_password)
        await update_password(user_id, hashed_pw)

    update_data = {}
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.bio is not None:
        update_data["bio"] = data.bio

    if update_data:
        await update_profile(user_id, update_data)

    return {"message": "Profile updated successfully"}


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(token: str):
    user_id = verify_verification_token(token)
    if not user_id:
        return HTMLResponse(
            "<h1>Invalid or expired verification link</h1>", status_code=400
        )

    # Set user as verified
    await user_collection.update_one(
        {"_id": ObjectId(user_id)}, {"$set": {"is_verified": True}}
    )
    return HTMLResponse("<h1>Email successfully verified. You can now log in.</h1>")

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import OAuth2PasswordBearer
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
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

# Pydantic модель для запроса повторной отправки
class ResendVerificationRequest(BaseModel):
    email: str

@router.post("/register")
async def register(user: UserRegister):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_data = user.dict()
    user_data["password"] = hash_password(user_data["password"])
    user_data["is_verified"] = False  # Явно устанавливаем как неверифицированный
    new_user = await create_user(user_data)

    # Generate token and send email
    verification_token = create_verification_token(str(new_user["_id"]))
    try:
        await send_verification_email(new_user["email"], verification_token)
    except Exception as e:
        print(f"Failed to send verification email: {e}")
        # Не прерываем регистрацию, если письмо не отправилось
        pass

    return {
        "message": "Registration successful. Please check your email to verify your account.",
        "email": new_user["email"]
    }


@router.post("/login")
async def login(user: UserLogin):
    db_user = await get_user_by_email(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ВАЖНО: Проверяем верификацию
    if not db_user.get("is_verified", False):
        raise HTTPException(
            status_code=403, 
            detail="Please verify your email before logging in. Check your inbox for verification link."
        )

    token = create_access_token({"user_id": str(db_user["_id"])})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/resend-verification")
async def resend_verification_email(request: ResendVerificationRequest):
    """Повторная отправка письма верификации"""
    try:
        # Проверяем, существует ли пользователь с таким email
        db_user = await get_user_by_email(request.email)
        if not db_user:
            raise HTTPException(
                status_code=404, 
                detail="User with this email address not found"
            )
        
        # Проверяем, не верифицирован ли уже пользователь
        if db_user.get("is_verified", False):
            raise HTTPException(
                status_code=400, 
                detail="Email address is already verified"
            )
        
        # Создаем новый токен верификации
        verification_token = create_verification_token(str(db_user["_id"]))
        
        # Отправляем письмо
        await send_verification_email(db_user["email"], verification_token)
        
        return {
            "message": "Verification email sent successfully. Please check your inbox.",
            "email": db_user["email"]
        }
        
    except HTTPException:
        # Перебрасываем HTTP исключения как есть
        raise
    except Exception as e:
        print(f"Error in resend_verification_email: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification email. Please try again later."
        )


@router.get("/check-verification-status")
async def check_verification_status(email: str = Query(...)):
    """Проверка статуса верификации пользователя"""
    try:
        db_user = await get_user_by_email(email)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "email": email,
            "is_verified": db_user.get("is_verified", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking verification status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/verify-email", response_class=HTMLResponse)
async def verify_email(token: str = Query(...)):
    user_id = verify_verification_token(token)
    if not user_id:
        return HTMLResponse(
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Failed</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        text-align: center;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .error {
                        color: #e74c3c;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    .message {
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                    }
                    .button {
                        display: inline-block;
                        background-color: #3498db;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="error">❌ Verification Failed</div>
                    <div class="message">
                        The verification link is invalid or has expired.<br>
                        Please request a new verification email.
                    </div>
                    <a href="http://localhost:3000/auth/login" class="button">
                        Go to Login
                    </a>
                </div>
            </body>
            </html>
            """, 
            status_code=400
        )

    # Проверяем, не верифицирован ли уже пользователь
    user = await get_user_by_id(user_id)
    if user and user.get("is_verified", False):
        return HTMLResponse(
            """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Already Verified</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        text-align: center;
                        background-color: #f5f5f5;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .success {
                        color: #27ae60;
                        font-size: 24px;
                        margin-bottom: 20px;
                    }
                    .message {
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                    }
                    .button {
                        display: inline-block;
                        background-color: #27ae60;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success">✅ Already Verified</div>
                    <div class="message">
                        Your email is already verified.<br>
                        You can now log in to your account.
                    </div>
                    <a href="http://localhost:3000/auth/login" class="button">
                        Go to Login
                    </a>
                </div>
            </body>
            </html>
            """
        )

    # Устанавливаем пользователя как верифицированного
    result = await user_collection.update_one(
        {"_id": ObjectId(user_id)}, 
        {"$set": {"is_verified": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verified Successfully</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    text-align: center;
                    background-color: #f5f5f5;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .success {
                    color: #27ae60;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                .message {
                    color: #666;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 30px;
                }
                .button {
                    display: inline-block;
                    background-color: #27ae60;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 0 10px;
                    transition: background-color 0.3s;
                }
                .button:hover {
                    background-color: #219a52;
                }
                .secondary-button {
                    background-color: #3498db;
                }
                .secondary-button:hover {
                    background-color: #2980b9;
                }
                .checkmark {
                    font-size: 48px;
                    color: #27ae60;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="checkmark">✅</div>
                <div class="success">Email Successfully Verified!</div>
                <div class="message">
                    Congratulations! Your email has been verified successfully.<br>
                    You can now log in to your account and access all features.
                </div>
                <a href="http://localhost:3000/auth/login" class="button">
                    Log In Now
                </a>
                <a href="http://localhost:3000" class="button secondary-button">
                    Go to Home
                </a>
            </div>
        </body>
        </html>
        """
    )


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
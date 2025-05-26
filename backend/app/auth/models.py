from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from .database import db
from passlib.context import CryptContext

user_collection = db["users"]
profile_collection = db["user_profiles"]  # новая коллекция

async def create_user(user_data: dict):
    new_user = {
        "email": user_data["email"],
        "password": user_data["password"],
        "full_name": user_data["full_name"]
    }
    result = await user_collection.insert_one(new_user)
    user_id = result.inserted_id

    # создаем пустой профиль
    await profile_collection.insert_one({
        "user_id": user_id,
        "phone": None,
        "bio": None
    })

    return {**new_user, "_id": user_id}

async def get_user_by_email(email: str):
    return await user_collection.find_one({"email": email})

async def get_user_by_id(user_id: str):
    return await user_collection.find_one({"_id": ObjectId(user_id)})

async def get_profile_by_user_id(user_id: str):
    return await profile_collection.find_one({"user_id": ObjectId(user_id)})

async def update_profile(user_id: str, data: dict):
    await profile_collection.update_one(
        {"user_id": ObjectId(user_id)},
        {"$set": data}
    )

async def update_password(user_id: str, new_hashed_password: str):
    await user_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": new_hashed_password}}
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = "mongodb+srv://donny040405:donny.2005@nosql.s8cgaxp.mongodb.net/"
client = AsyncIOMotorClient(MONGO_URL)
db = client.auth_db
user_collection = db.users

from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import aiosmtplib
from email.message import EmailMessage

# JWT конфигурация
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except JWTError:
        return None

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# Email verification utility
def create_verification_token(user_id: str):
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode = {"user_id": user_id, "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_verification_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except JWTError:
        return None
    
async def send_verification_email(to_email: str, token: str):
    message = EmailMessage()
    message["From"] = "sultok.003@example.com"
    message["To"] = to_email
    message["Subject"] = "Verify your email"
    verify_url = f"http://localhost:8000/auth/verify-email?token={token}"
    message.set_content(f"Click the link to verify your email: {verify_url}")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",  # or your SMTP host
        port=587,
        start_tls=True,
        username="sultok.003@gmail.com",
        password="tlpp bstc ufqf tcvb"
    )
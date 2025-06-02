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
    message["Subject"] = "Verify your email address"
    
    verify_url = f"http://localhost:8000/auth/verify-email?token={token}"
    
    # HTML версия письма
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; margin-bottom: 10px;">Email Verification</h1>
                <p style="color: #666; font-size: 16px;">Please verify your email address to complete registration</p>
            </div>
            
            <div style="margin-bottom: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                    Hello,<br><br>
                    Thank you for registering! To complete your account setup, please click the button below to verify your email address.
                </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verify_url}" 
                   style="display: inline-block; background-color: #27ae60; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
                    Verify Email Address
                </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px; line-height: 1.5;">
                    If the button doesn't work, you can copy and paste this link into your browser:<br>
                    <a href="{verify_url}" style="color: #3498db; word-break: break-all;">{verify_url}</a>
                </p>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Текстовая версия письма
    text_content = f"""
    Email Verification
    
    Hello,
    
    Thank you for registering! To complete your account setup, please click the link below to verify your email address:
    
    {verify_url}
    
    This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    
    If you're having trouble clicking the link, copy and paste it into your web browser.
    """
    
    message.set_content(text_content)
    message.add_alternative(html_content, subtype='html')

    try:
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username="sultok.003@gmail.com",
            password="tlpp bstc ufqf tcvb"
        )
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise Exception("Failed to send verification email")
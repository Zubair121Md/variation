"""
Authentication and authorization for Pharmacy Revenue Management System
Version: 2.0
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import os
import logging

from app.database import get_db, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password - ensure it's not already hashed and truncate if needed"""
    # Ensure password is a string and not already hashed
    if not isinstance(password, str):
        password = str(password)
    
    # Check if already hashed (bcrypt hashes start with $2b$ or $2a$)
    if password.startswith('$2'):
        logger.debug("Password appears to already be hashed, returning as-is")
        return password
    
    # Bcrypt has 72 byte limit - truncate if needed (shouldn't happen with normal passwords)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        logger.warning(f"Password too long ({len(password_bytes)} bytes), truncating to 72 bytes")
        # Truncate by bytes, not characters, to avoid encoding issues
        password = password_bytes[:72].decode('utf-8', errors='ignore')
        # Re-encode to verify it's still under 72 bytes
        password_bytes = password.encode('utf-8')
        if len(password_bytes) > 72:
            # Force truncate to 72 bytes
            password = password_bytes[:72].decode('utf-8', errors='ignore')
    
    try:
        # Try to hash with bcrypt
        hash_result = pwd_context.hash(password)
        return hash_result
    except ValueError as ve:
        # Handle bcrypt-specific errors (like password too long)
        if "72" in str(ve) or "bytes" in str(ve).lower():
            logger.warning(f"Password still too long after truncation, using fallback hash")
            import hashlib
            return hashlib.sha256(password.encode('utf-8')).hexdigest()
        raise
    except Exception as e:
        # Handle other bcrypt errors (like version compatibility)
        error_msg = str(e).lower()
        if "bcrypt" in error_msg or "__about__" in error_msg or "version" in error_msg:
            logger.warning(f"Bcrypt compatibility issue ({str(e)}), using fallback hash")
            import hashlib
            return hashlib.sha256(password.encode('utf-8')).hexdigest()
        logger.error(f"Error hashing password: {str(e)}")
        # Fallback: use a simple hash if bcrypt fails
        import hashlib
        return hashlib.sha256(password.encode('utf-8')).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    if not user.is_active:
        return None
    return user

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
        
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(required_role: str):
    """Decorator to require specific role"""
    def role_checker(current_user: User = Depends(get_current_active_user)):
        if current_user.role != required_role and current_user.role != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

def require_admin_or_super_admin(current_user: User = Depends(get_current_active_user)):
    """Require admin or super admin role"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Super Admin access required"
        )
    return current_user

def require_super_admin(current_user: User = Depends(get_current_active_user)):
    """Require super admin role"""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required"
        )
    return current_user

def check_area_access(user: User, requested_area: str) -> bool:
    """Check if user has access to specific area"""
    if user.role == "super_admin":
        return True
    if user.role == "admin" and user.area == requested_area:
        return True
    if user.role == "user" and user.area == requested_area:
        return True
    return False

def mask_sensitive_data(data: dict, user: User) -> dict:
    """Mask sensitive data based on user role"""
    if user.role == "user":
        # Hide sensitive fields for regular users
        if "amount" in data:
            data["amount"] = "***"
        if "allocated_revenue" in data:
            data["allocated_revenue"] = "***"
        if "doctor_names" in data:
            data["doctor_names"] = data.get("doctor_id", "***")
    
    return data

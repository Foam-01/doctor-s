from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
import shutil
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    DOCTOR = "doctor"
    ADMIN = "admin"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ShiftPosition(str, Enum):
    GENERAL_PRACTITIONER = "แพทย์ทั่วไป"
    INTERNAL_MEDICINE = "แพทย์อายุรกรรม"
    SURGERY = "แพทย์ศัลยกรรม"
    PEDIATRICS = "แพทย์กุมารเวชศาสตร์"
    OBSTETRICS_GYNECOLOGY = "แพทย์สูติ-นรีเวชกรรม"
    EMERGENCY_MEDICINE = "แพทย์ฉุกเฉิน"
    ANESTHESIOLOGY = "แพทย์วิสัญญีวิทยา"
    RADIOLOGY = "แพทย์รังสีวิทยา"
    PATHOLOGY = "แพทย์พยาธิวิทยา"
    PSYCHIATRY = "แพทย์จิตเวชศาสตร์"

# Models
class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: str
    medical_license_number: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone_number: str
    medical_license_number: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: str
    medical_license_number: str
    role: UserRole = UserRole.DOCTOR
    approval_status: ApprovalStatus = ApprovalStatus.PENDING
    license_image_path: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    approved_by: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone_number: str
    medical_license_number: str
    role: UserRole
    approval_status: ApprovalStatus
    license_image_path: Optional[str] = None
    created_at: datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ShiftCreate(BaseModel):
    position: ShiftPosition
    shift_date: str  # YYYY-MM-DD format
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    hospital_name: str
    location: str
    compensation: float
    description: Optional[str] = None
    requirements: Optional[str] = None
    contact_method: str = "แชทในแพลตฟอร์ม"

class Shift(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    doctor_name: str
    position: ShiftPosition
    shift_date: str
    start_time: str
    end_time: str
    hospital_name: str
    location: str
    compensation: float
    description: Optional[str] = None
    requirements: Optional[str] = None
    contact_method: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class ShiftResponse(BaseModel):
    id: str
    doctor_id: str
    doctor_name: str
    position: ShiftPosition
    shift_date: str
    start_time: str
    end_time: str
    hospital_name: str
    location: str
    compensation: float
    description: Optional[str] = None
    requirements: Optional[str] = None
    contact_method: str
    created_at: datetime
    is_active: bool

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

async def get_current_approved_user(current_user: User = Depends(get_current_user)):
    if current_user.approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not approved yet"
        )
    return current_user

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN or current_user.approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Auth Routes
@api_router.post("/register", response_model=UserResponse)
async def register(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    phone_number: str = Form(...),
    medical_license_number: str = Form(...),
    license_image: UploadFile = File(...)
):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate file type
    if not license_image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Save uploaded image
    file_extension = license_image.filename.split('.')[-1]
    filename = f"{str(uuid.uuid4())}.{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(license_image.file, buffer)
    
    # Create user
    hashed_password = get_password_hash(password)
    user_data = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password": hashed_password,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": phone_number,
        "medical_license_number": medical_license_number,
        "role": UserRole.DOCTOR,
        "approval_status": ApprovalStatus.PENDING,
        "license_image_path": f"/uploads/{filename}",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_data)
    
    # Remove password from response
    user_data.pop("password")
    return UserResponse(**user_data)

@api_router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user_data = await db.users.find_one({"email": user_credentials.email})
    if not user_data or not verify_password(user_credentials.password, user_data["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": user_data["id"]})
    user_data.pop("password")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user_data)
    )

@api_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Admin Routes
@api_router.get("/admin/pending-users", response_model=List[UserResponse])
async def get_pending_users(admin_user: User = Depends(get_current_admin)):
    pending_users = await db.users.find({"approval_status": ApprovalStatus.PENDING}).to_list(1000)
    return [UserResponse(**user) for user in pending_users]

@api_router.post("/admin/approve-user/{user_id}")
async def approve_user(user_id: str, admin_user: User = Depends(get_current_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "approval_status": ApprovalStatus.APPROVED,
                "approved_at": datetime.utcnow(),
                "approved_by": admin_user.id
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User approved successfully"}

@api_router.post("/admin/reject-user/{user_id}")
async def reject_user(user_id: str, admin_user: User = Depends(get_current_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"approval_status": ApprovalStatus.REJECTED}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User rejected"}

# Shift Routes
@api_router.post("/shifts", response_model=ShiftResponse)
async def create_shift(shift_data: ShiftCreate, current_user: User = Depends(get_current_approved_user)):
    shift_dict = shift_data.dict()
    shift_dict.update({
        "id": str(uuid.uuid4()),
        "doctor_id": current_user.id,
        "doctor_name": f"{current_user.first_name} {current_user.last_name}",
        "created_at": datetime.utcnow(),
        "is_active": True
    })
    
    await db.shifts.insert_one(shift_dict)
    return ShiftResponse(**shift_dict)

@api_router.get("/shifts", response_model=List[ShiftResponse])
async def get_shifts(
    position: Optional[ShiftPosition] = None,
    location: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: User = Depends(get_current_approved_user)
):
    filter_query = {"is_active": True}
    
    if position:
        filter_query["position"] = position
    if location:
        filter_query["location"] = {"$regex": location, "$options": "i"}
    if date_from:
        filter_query["shift_date"] = {"$gte": date_from}
    if date_to:
        if "shift_date" in filter_query:
            filter_query["shift_date"]["$lte"] = date_to
        else:
            filter_query["shift_date"] = {"$lte": date_to}
    
    shifts = await db.shifts.find(filter_query).sort("shift_date", 1).to_list(1000)
    return [ShiftResponse(**shift) for shift in shifts]

@api_router.get("/my-shifts", response_model=List[ShiftResponse])
async def get_my_shifts(current_user: User = Depends(get_current_approved_user)):
    shifts = await db.shifts.find({"doctor_id": current_user.id}).sort("created_at", -1).to_list(1000)
    return [ShiftResponse(**shift) for shift in shifts]

@api_router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str, current_user: User = Depends(get_current_approved_user)):
    result = await db.shifts.update_one(
        {"id": shift_id, "doctor_id": current_user.id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shift not found or not authorized")
    
    return {"message": "Shift deleted successfully"}

# Create admin user if not exists
@api_router.post("/create-admin")
async def create_admin():
    admin_exists = await db.users.find_one({"role": UserRole.ADMIN})
    if admin_exists:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin_data = {
        "id": str(uuid.uuid4()),
        "email": "admin@doctorshift.com",
        "password": get_password_hash("admin123"),
        "first_name": "Admin",
        "last_name": "System",
        "phone_number": "0000000000",
        "medical_license_number": "ADMIN001",
        "role": UserRole.ADMIN,
        "approval_status": ApprovalStatus.APPROVED,
        "license_image_path": None,
        "created_at": datetime.utcnow(),
        "approved_at": datetime.utcnow()
    }
    
    await db.users.insert_one(admin_data)
    return {"message": "Admin created successfully", "email": "admin@doctorshift.com", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
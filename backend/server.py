from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from enum import Enum
from contextlib import asynccontextmanager # YENİ EKLENDİ

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Şifreleme
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT ayarları
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'akademik-buyucu-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 gün

# Security
security = HTTPBearer()

# --- YENİ EKLENEN KISIM (LIFESPAN) ---
# on_event yerine bu yapı kullanılıyor
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama açılırken yapılacak işlemler (Buraya log atabilirsin)
    logger.info("Veritabanı bağlantısı başlatıldı.")
    yield
    # Uygulama kapanırken yapılacak işlemler
    client.close()
    logger.info("Veritabanı bağlantısı kapatıldı.")

# Create the main app (lifespan parametresi eklendi)
app = FastAPI(title="Akademik Büyücü API", lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enum tanımları
class RepeatType(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"

class TalismanCondition(str, Enum):
    FIRST_SPELL = "FIRST_SPELL"
    LEVEL_5 = "LEVEL_5"
    LEVEL_10 = "LEVEL_10"
    STREAK_7 = "STREAK_7"
    STREAK_30 = "STREAK_30"
    SPELLS_10 = "SPELLS_10"
    SPELLS_50 = "SPELLS_50"
    SPELLS_100 = "SPELLS_100"

# Pydantic Modeller
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    xp: int = 0
    level: int = 1
    currentStreak: int = 0
    maxStreak: int = 0
    totalSpellsCompleted: int = 0
    lastCompletionDate: Optional[str] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Spell(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    repeatType: RepeatType
    isCompleted: bool = False
    xpReward: int
    userId: str
    completedDates: List[str] = []
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SpellCreate(BaseModel):
    title: str
    description: str
    repeatType: RepeatType
    xpReward: int = 10

class SpellUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    repeatType: Optional[RepeatType] = None
    xpReward: Optional[int] = None

class Talisman(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    iconUrl: str
    condition: TalismanCondition

class UserTalisman(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    talismanId: str
    unlockedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    username: str
    xp: int
    level: int

class UserStats(BaseModel):
    totalSpellsCompleted: int
    currentStreak: int
    maxStreak: int
    xp: int
    level: int
    unlockedTalismans: int

# Yardımcı fonksiyonlar
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token geçersiz")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi dolmuş")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token geçersiz")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
    
    if isinstance(user_doc.get('createdAt'), str):
        user_doc['createdAt'] = datetime.fromisoformat(user_doc['createdAt'])
    
    return User(**user_doc)

def calculate_level(xp: int) -> int:
    # Her 100 XP'de bir seviye atlama
    return (xp // 100) + 1

async def check_and_unlock_talismans(user: User):
    # Tılsımları kontrol et ve kilidi aç
    conditions_met = []
    
    if user.totalSpellsCompleted >= 1:
        conditions_met.append(TalismanCondition.FIRST_SPELL)
    if user.level >= 5:
        conditions_met.append(TalismanCondition.LEVEL_5)
    if user.level >= 10:
        conditions_met.append(TalismanCondition.LEVEL_10)
    if user.currentStreak >= 7:
        conditions_met.append(TalismanCondition.STREAK_7)
    if user.currentStreak >= 30:
        conditions_met.append(TalismanCondition.STREAK_30)
    if user.totalSpellsCompleted >= 10:
        conditions_met.append(TalismanCondition.SPELLS_10)
    if user.totalSpellsCompleted >= 50:
        conditions_met.append(TalismanCondition.SPELLS_50)
    if user.totalSpellsCompleted >= 100:
        conditions_met.append(TalismanCondition.SPELLS_100)
    
    # Tüm tılsımları getir
    talismans = await db.talismans.find({}, {"_id": 0}).to_list(1000)
    
    for talisman in talismans:
        if talisman['condition'] in [c.value for c in conditions_met]:
            # Kullanıcının bu tılsımı var mı kontrol et
            existing = await db.user_talismans.find_one({
                "userId": user.id,
                "talismanId": talisman['id']
            })
            
            if not existing:
                # Yeni tılsım kilidi aç
                user_talisman = UserTalisman(
                    userId=user.id,
                    talismanId=talisman['id']
                )
                doc = user_talisman.model_dump()
                doc['unlockedAt'] = doc['unlockedAt'].isoformat()
                await db.user_talismans.insert_one(doc)

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    # Email kontrolü
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı")
    
    # Kullanıcı oluştur
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['createdAt'] = user_dict['createdAt'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Token oluştur
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {
        "token": access_token,
        "user": user.model_dump()
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Kullanıcıyı bul
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    # Şifre kontrolü
    if not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Email veya şifre hatalı")
    
    # Token oluştur
    access_token = create_access_token(
        data={"sub": user_doc['id']},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # Password'u çıkar
    user_doc.pop('password')
    if isinstance(user_doc.get('createdAt'), str):
        user_doc['createdAt'] = datetime.fromisoformat(user_doc['createdAt'])
    
    return {
        "token": access_token,
        "user": user_doc
    }

# User endpoints
@api_router.get("/user/profile", response_model=User)
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.get("/user/stats", response_model=UserStats)
async def get_user_stats(current_user: User = Depends(get_current_user)):
    # Kullanıcının tılsım sayısını al
    talisman_count = await db.user_talismans.count_documents({"userId": current_user.id})
    
    return UserStats(
        totalSpellsCompleted=current_user.totalSpellsCompleted,
        currentStreak=current_user.currentStreak,
        maxStreak=current_user.maxStreak,
        xp=current_user.xp,
        level=current_user.level,
        unlockedTalismans=talisman_count
    )

# Spell endpoints
@api_router.post("/spells", response_model=Spell)
async def create_spell(spell_data: SpellCreate, current_user: User = Depends(get_current_user)):
    spell = Spell(
        title=spell_data.title,
        description=spell_data.description,
        repeatType=spell_data.repeatType,
        xpReward=spell_data.xpReward,
        userId=current_user.id
    )
    
    spell_dict = spell.model_dump()
    spell_dict['createdAt'] = spell_dict['createdAt'].isoformat()
    
    await db.spells.insert_one(spell_dict)
    return spell

@api_router.get("/spells", response_model=List[Spell])
async def get_spells(current_user: User = Depends(get_current_user)):
    spells = await db.spells.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    
    for spell in spells:
        if isinstance(spell.get('createdAt'), str):
            spell['createdAt'] = datetime.fromisoformat(spell['createdAt'])
    
    return spells

@api_router.put("/spells/{spell_id}", response_model=Spell)
async def update_spell(spell_id: str, spell_data: SpellUpdate, current_user: User = Depends(get_current_user)):
    # Büyüyü bul
    spell = await db.spells.find_one({"id": spell_id, "userId": current_user.id}, {"_id": 0})
    if not spell:
        raise HTTPException(status_code=404, detail="Büyü bulunamadı")
    
    # Güncelle
    update_data = {k: v for k, v in spell_data.model_dump().items() if v is not None}
    if update_data:
        await db.spells.update_one({"id": spell_id}, {"$set": update_data})
        spell.update(update_data)
    
    if isinstance(spell.get('createdAt'), str):
        spell['createdAt'] = datetime.fromisoformat(spell['createdAt'])
    
    return Spell(**spell)

@api_router.delete("/spells/{spell_id}")
async def delete_spell(spell_id: str, current_user: User = Depends(get_current_user)):
    result = await db.spells.delete_one({"id": spell_id, "userId": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Büyü bulunamadı")
    return {"message": "Büyü silindi"}

@api_router.post("/spells/{spell_id}/complete")
async def complete_spell(spell_id: str, current_user: User = Depends(get_current_user)):
    # Büyüyü bul
    spell = await db.spells.find_one({"id": spell_id, "userId": current_user.id}, {"_id": 0})
    if not spell:
        raise HTTPException(status_code=404, detail="Büyü bulunamadı")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Bugün zaten tamamlanmış mı kontrol et
    if today in spell.get('completedDates', []):
        raise HTTPException(status_code=400, detail="Bu büyü bugün zaten tamamlanmış")
    
    # Büyüyü tamamla
    completed_dates = spell.get('completedDates', [])
    completed_dates.append(today)
    
    await db.spells.update_one(
        {"id": spell_id},
        {"$set": {
            "completedDates": completed_dates
        }}
    )
    
    # Kullanıcıyı güncelle - XP ekle ve seviye kontrolü
    new_xp = current_user.xp + spell['xpReward']
    new_level = calculate_level(new_xp)
    
    # Streak hesaplama
    yesterday = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
    if current_user.lastCompletionDate == yesterday:
        new_streak = current_user.currentStreak + 1
    elif current_user.lastCompletionDate == today:
        new_streak = current_user.currentStreak
    else:
        new_streak = 1
    
    new_max_streak = max(current_user.maxStreak, new_streak)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "xp": new_xp,
            "level": new_level,
            "currentStreak": new_streak,
            "maxStreak": new_max_streak,
            "totalSpellsCompleted": current_user.totalSpellsCompleted + 1,
            "lastCompletionDate": today
        }}
    )
    
    # Güncel kullanıcıyı al
    updated_user_doc = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    if isinstance(updated_user_doc.get('createdAt'), str):
        updated_user_doc['createdAt'] = datetime.fromisoformat(updated_user_doc['createdAt'])
    updated_user = User(**updated_user_doc)
    
    # Tılsımları kontrol et
    await check_and_unlock_talismans(updated_user)
    
    return {
        "message": "Büyü tamamlandı!",
        "xpGained": spell['xpReward'],
        "newXp": new_xp,
        "newLevel": new_level,
        "leveledUp": new_level > current_user.level,
        "newStreak": new_streak
    }

# Talisman endpoints
@api_router.get("/talismans", response_model=List[Talisman])
async def get_all_talismans():
    talismans = await db.talismans.find({}, {"_id": 0}).to_list(1000)
    return talismans

@api_router.get("/user/talismans")
async def get_user_talismans(current_user: User = Depends(get_current_user)):
    # Kullanıcının tılsımlarını al
    user_talismans = await db.user_talismans.find({"userId": current_user.id}, {"_id": 0}).to_list(1000)
    
    # Tılsım detaylarını al
    talisman_ids = [ut['talismanId'] for ut in user_talismans]
    talismans = await db.talismans.find({"id": {"$in": talisman_ids}}, {"_id": 0}).to_list(1000)
    
    # Birleştir
    result = []
    for ut in user_talismans:
        talisman = next((t for t in talismans if t['id'] == ut['talismanId']), None)
        if talisman:
            if isinstance(ut.get('unlockedAt'), str):
                ut['unlockedAt'] = datetime.fromisoformat(ut['unlockedAt'])
            result.append({
                **talisman,
                "unlockedAt": ut['unlockedAt']
            })
    
    return result

# Leaderboard endpoint
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 10):
    users = await db.users.find({}, {"_id": 0, "username": 1, "xp": 1, "level": 1}).sort("xp", -1).limit(limit).to_list(limit)
    return users

# Başlangıç verilerini oluştur
@api_router.post("/init-data")
async def initialize_data():
    # Tılsımları oluştur (eğer yoksa)
    existing_talismans = await db.talismans.count_documents({})
    if existing_talismans == 0:
        talismans_data = [
            {
                "id": str(uuid.uuid4()),
                "name": "İlk Adım",
                "description": "İlk büyünü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1617004890831-c99c16006144?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.FIRST_SPELL.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Çırak Büyücü",
                "description": "Seviye 5'e ulaş",
                "iconUrl": "https://images.unsplash.com/photo-1633785584922-503ad0e982f5?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.LEVEL_5.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Usta Büyücü",
                "description": "Seviye 10'a ulaş",
                "iconUrl": "https://images.unsplash.com/photo-1617004890831-c99c16006144?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.LEVEL_10.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Haftalık Disiplin",
                "description": "7 gün üst üste büyü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1633785584922-503ad0e982f5?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.STREAK_7.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Aylık Kararlılık",
                "description": "30 gün üst üste büyü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1617004890831-c99c16006144?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.STREAK_30.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Büyü Koleksiyoncusu",
                "description": "10 büyü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1633785584922-503ad0e982f5?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.SPELLS_10.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Büyü Ustası",
                "description": "50 büyü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1617004890831-c99c16006144?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.SPELLS_50.value
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Efsanevi Büyücü",
                "description": "100 büyü tamamla",
                "iconUrl": "https://images.unsplash.com/photo-1633785584922-503ad0e982f5?crop=entropy&cs=srgb&fm=jpg&q=85",
                "condition": TalismanCondition.SPELLS_100.value
            }
        ]
        await db.talismans.insert_many(talismans_data)
        return {"message": "Tılsımlar oluşturuldu"}
    
    return {"message": "Veriler zaten mevcut"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

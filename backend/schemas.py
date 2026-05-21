from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class MemberBase(BaseModel):
    dni: str
    name: str
    email: Optional[str] = None
    status: str = "ACTIVO"
    photo_url: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = "123"
    membership_type: Optional[str] = None
    wellness_data: Optional[Dict] = None

class MemberCreate(MemberBase):
    joined_at: Optional[datetime] = None

class MemberSchema(MemberBase):
    id: int
    joined_at: datetime
    last_checkin: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentSchema(BaseModel):
    id: int
    amount: float
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class BookingSchema(BaseModel):
    id: int
    class_name: str
    start_time: datetime
    status: str

    class Config:
        from_attributes = True

class CheckinSchema(BaseModel):
    id: int
    member_id: int
    checkin_at: datetime
    class Config:
        from_attributes = True

class StaffBase(BaseModel):
    name: str
    username: Optional[str] = None
    role: str
    shift: Optional[str] = "Mañana"
    password: Optional[str] = "1234"

class StaffCreate(StaffBase):
    pass

class StaffSchema(StaffBase):
    id: int

    class Config:
        from_attributes = True

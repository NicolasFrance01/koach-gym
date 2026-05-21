from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    dni = Column(String, unique=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    status = Column(String, default="ACTIVO") # ACTIVO, DEUDA, POR VENCER, INACTIVO
    photo_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    password = Column(String, default="123")
    membership_type = Column(String) # Basic, Premium, Elite
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_checkin = Column(DateTime, nullable=True)
    
    # Wellness metrics (JSON for flexibility in prototyping)
    wellness_data = Column(JSON, nullable=True) # {hrv: 65, sleep_quality: 0.8, etc}
    
    payments = relationship("Payment", back_populates="member")
    bookings = relationship("Booking", back_populates="member")
    checkins = relationship("Checkin", back_populates="member")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    amount = Column(Float)
    currency = Column(String, default="USD")
    status = Column(String) # paid, pending, failed
    method = Column(String, default="Efectivo") # Efectivo, Tarjeta, etc
    stripe_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    member = relationship("Member", back_populates="payments")

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    class_name = Column(String)
    start_time = Column(DateTime)
    status = Column(String) # reserved, attended, cancelled

    member = relationship("Member", back_populates="bookings")

class Staff(Base):
    __tablename__ = "staff"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    username = Column(String, unique=True, index=True, nullable=True)
    role = Column(String) # Trainer, Reception, Manager
    password = Column(String, default="1234")
    shift = Column(String, default="Mañana")

class Checkin(Base):
    __tablename__ = "checkins"
    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    checkin_at = Column(DateTime, default=datetime.datetime.utcnow)
    member = relationship("Member", back_populates="checkins")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    stock = Column(Integer)
    category = Column(String) # Supplements, Drinks, Merch

class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    days_per_week = Column(Integer, default=3)
    classes = Column(JSON, default=[])
    is_active = Column(Boolean, default=True)

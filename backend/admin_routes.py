from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from typing import List
import datetime
from sqlalchemy import func

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/stats")
def get_gym_stats(db: Session = Depends(get_db)):
    active_members = db.query(models.Member).filter(models.Member.status == "ACTIVO").count()
    revenue = db.query(models.Payment).filter(models.Payment.status == "paid").all()
    total_revenue = sum(p.amount for p in revenue)
    
    churn_risk = db.query(models.Member).filter(models.Member.status == "DEUDA").count()
    por_vencer = db.query(models.Member).filter(models.Member.status == "POR VENCER").count()
    
    return {
        "active_members": active_members,
        "total_revenue": total_revenue,
        "churn_risk_count": churn_risk,
        "por_vencer_count": por_vencer,
        "alerts": [
            {"type": "churn", "message": f"{churn_risk} members are in debt and at risk of cancellation."},
            {"type": "renewal", "message": f"{por_vencer} memberships are expiring soon."}
        ]
    }

@router.get("/members", response_model=List[schemas.MemberSchema])
def get_all_members(db: Session = Depends(get_db)):
    return db.query(models.Member).all()

@router.post("/members", response_model=schemas.MemberSchema)
def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    print(f"Creating member: {member.name} with DNI {member.dni}")
    data = member.dict()
    if not data.get('email'):
        data['email'] = None
    if not data.get('phone'):
        data['phone'] = None
    db_member = models.Member(**data)
    db.add(db_member)
    try:
        db.commit()
        db.refresh(db_member)
        print(f"Member created successfully with ID {db_member.id}")
        return db_member
    except Exception as e:
        db.rollback()
        print(f"Error creating member: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/members/{member_id}", response_model=schemas.MemberSchema)
def update_member(member_id: int, member_data: schemas.MemberCreate, db: Session = Depends(get_db)):
    db_member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Member not found")

    data = member_data.dict()
    if not data.get('email'):
        data['email'] = None
    if not data.get('phone'):
        data['phone'] = None
    for key, value in data.items():
        setattr(db_member, key, value)

    db.commit()
    db.refresh(db_member)
    return db_member

@router.put("/members/{member_id}/status")
def update_member_status(member_id: int, status: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.status = status
    db.commit()
    return {"status": "updated", "new_status": status}

@router.post("/payments")
def record_payment(member_id: int, amount: float, method: str = "card", db: Session = Depends(get_db)):
    now = datetime.datetime.utcnow()
    payment = models.Payment(member_id=member_id, amount=amount, status="paid", method=method, created_at=now)
    db.add(payment)
    member = db.query(models.Member).get(member_id)
    if member:
        member.status = "ACTIVO"
        member.joined_at = now  # restart 30-day cycle from today
    db.commit()
    return {"status": "payment recorded"}

@router.get("/pricing/dynamic")
def calculate_dynamic_price(db: Session = Depends(get_db)):
    active_count = db.query(models.Member).filter(models.Member.status == "ACTIVO").count()
    base_price = 49.99
    demand_factor = 1.0 + (max(0, active_count - 20) * 0.015)
    return {"calculated_price": round(base_price * demand_factor, 2), "demand_factor": round(demand_factor, 2)}

@router.delete("/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.Member).get(member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"status": "deleted"}

@router.get("/finance/summary")
def get_finance_summary(db: Session = Depends(get_db)):
    # Group payments by month for chart
    payments = db.query(models.Payment).all()
    
    monthly_revenue = {}
    for p in payments:
        month_key = p.created_at.strftime("%b %Y")
        monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + p.amount
        
    chart_data = [{"month": k, "revenue": round(v, 2)} for k, v in monthly_revenue.items()]
    # Sort chronologically by converting back to date, but here we just reverse since they were seeded backwards
    chart_data.reverse()
    
    recent_transactions = [
        {"id": p.id, "member_id": p.member_id, "amount": p.amount, "date": p.created_at.strftime("%Y-%m-%d")} 
        for p in sorted(payments, key=lambda x: x.created_at, reverse=True)[:10]
    ]
    
    return {
        "chart_data": chart_data,
        "recent_payments": recent_transactions,
        "total_revenue": sum(p.amount for p in payments)
    }

@router.get("/staff", response_model=List[schemas.StaffSchema])
def get_all_staff(db: Session = Depends(get_db)):
    staff = db.query(models.Staff).all()
    return staff

@router.post("/staff", response_model=schemas.StaffSchema)
def create_staff(staff: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = models.Staff(**staff.dict())
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

@router.put("/staff/{staff_id}", response_model=schemas.StaffSchema)
def update_staff(staff_id: int, staff_data: schemas.StaffCreate, db: Session = Depends(get_db)):
    db_staff = db.query(models.Staff).filter(models.Staff.id == staff_id).first()
    if not db_staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    for key, value in staff_data.dict().items():
        setattr(db_staff, key, value)
    
    db.commit()
    db.refresh(db_staff)
    return db_staff

@router.delete("/staff/{staff_id}")
def delete_staff(staff_id: int, db: Session = Depends(get_db)):
    staff = db.query(models.Staff).get(staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.delete(staff)
    db.commit()
    return {"status": "deleted"}

@router.get("/analytics/ai")
def get_ai_analytics(db: Session = Depends(get_db)):
    # Mock data for AI Analytics Charts
    attendance_heatmap = [
        {"day": "Mon", "morning": 40, "afternoon": 25, "evening": 85},
        {"day": "Tue", "morning": 45, "afternoon": 20, "evening": 90},
        {"day": "Wed", "morning": 35, "afternoon": 30, "evening": 80},
        {"day": "Thu", "morning": 50, "afternoon": 25, "evening": 95},
        {"day": "Fri", "morning": 30, "afternoon": 40, "evening": 60},
        {"day": "Sat", "morning": 70, "afternoon": 50, "evening": 20},
        {"day": "Sun", "morning": 80, "afternoon": 30, "evening": 10},
    ]
    
    churn_factors = [
        {"factor": "Low Attendance", "impact": 45},
        {"factor": "Price Sensitivity", "impact": 25},
        {"factor": "No Trainer Engagement", "impact": 20},
        {"factor": "Facility Location", "impact": 10},
    ]
    
    return {
        "attendance_heatmap": attendance_heatmap,
        "churn_factors": churn_factors
    }

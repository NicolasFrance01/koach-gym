from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy import text
import os
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import asyncio
from fastapi.middleware.cors import CORSMiddleware

# Relative imports for Vercel
from . import models
from .database import engine, get_db
from .cv_engine import CVEngine
from . import admin_routes
from . import user_routes
from . import totem_routes

models.Base.metadata.create_all(bind=engine)

cv_engine = CVEngine()

# Start camera only if explicitly requested or in local environments
if os.getenv("LOCAL_CAMERA", "false").lower() == "true":
    try:
        cv_engine.start()
    except Exception as e:
        print(f"Failed to start camera: {e}")

app = FastAPI(title="Gym-Atlas API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(admin_routes.router)
app.include_router(user_routes.router)
app.include_router(totem_routes.router)

# Middleware to handle /api prefix on Vercel
@app.middleware("http")
async def strip_api_prefix(request, call_next):
    path = request.url.path
    if path.startswith("/api"):
        request.scope["path"] = path[4:]
        if not request.scope["path"]:
            request.scope["path"] = "/"
    response = await call_next(request)
    return response

@app.get("/")
def read_root():
    return {"status": "Gym-Atlas Backend is running", "version": "2.0.0"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # Try a simple query
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e), "database_url_env": os.getenv("DATABASE_URL") is not None}

@app.get("/debug/db")
def debug_db():
    url = os.getenv("DATABASE_URL", "NOT_SET")
    if url != "NOT_SET" and len(url) > 10:
        masked_url = f"{url[:10]}...{url[-10:]}"
    else:
        masked_url = url
    
    return {
        "env_variable_present": os.getenv("DATABASE_URL") is not None,
        "masked_url": masked_url,
        "current_engine": str(engine.url.drivername) if hasattr(engine, 'url') else "unknown",
        "is_sqlite": "sqlite" in str(engine.url)
    }

@app.get("/members/{dni}")
def get_member(dni: str, db: Session = Depends(get_db)):
    member = db.query(models.Member).filter(models.Member.dni == dni).first()
    if not member:
        return {"error": "Member not found"}
    
    # Logic for access control
    cv_engine.set_member_status(member.name, member.status)
    return member

def gen_frames():
    while True:
        frame = cv_engine.get_frame()
        if frame is not None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        else:
            break

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(gen_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

async def ws_announcer():
    last_alarm_state = False
    while True:
        current_alarm = cv_engine.is_alarm_active
        if current_alarm != last_alarm_state:
            await manager.broadcast({"type": "alarm_state", "active": current_alarm})
            last_alarm_state = current_alarm
        await asyncio.sleep(0.1)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(ws_announcer())

@app.websocket("/ws")
async def websocket_clients(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Required for Vercel
handler = app

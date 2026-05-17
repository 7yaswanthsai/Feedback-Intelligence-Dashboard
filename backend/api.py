from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from .kpi_service import calculate_mentor_kpis, generate_executive_insights, get_mentor_trends, get_analytics, get_mentor_feedback_intelligence, get_mentor_comments
from .sync_service import sync_feedback
from .logger import logger
from .reporting_service import get_flat_feedback_data
import os
from .ai_service import generate_mentor_brief

app = FastAPI(title="Feedback Intelligence API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = BackgroundScheduler()

SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", 60))


@app.on_event("startup")
def start_scheduler():
    logger.info("Starting background sync scheduler...")
    scheduler.add_job(sync_feedback, "interval", seconds=SYNC_INTERVAL)
    scheduler.start()


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/sync")
def trigger_sync():
    sync_feedback()
    return {"message": "Manual sync completed"}


@app.get("/mentors/kpi")
def mentor_kpis():
    return calculate_mentor_kpis()


@app.get("/insights")
def insights():
    return generate_executive_insights()

@app.get("/reports/feedback")
def feedback_report():
    return get_flat_feedback_data()

@app.get("/mentors/trends")
def mentor_trends():
    return get_mentor_trends()

@app.get("/analytics")
def analytics(
    program: str | None = Query(default=None),
    cohort: str | None = Query(default=None),
    mentor: str | None = Query(default=None)
):
    return get_analytics(program, cohort, mentor)

@app.get("/mentor-intelligence/{mentor_id}")
def mentor_intelligence(mentor_id: int):
    return generate_mentor_brief(mentor_id)

@app.get("/mentor-comments/{mentor_id}")
def mentor_comments(mentor_id: int, limit: int = 20):
    return get_mentor_comments(mentor_id, limit)

@app.get("/mentor-feedback/{mentor_id}")
def mentor_feedback(mentor_id: int):
    return get_mentor_feedback_intelligence(mentor_id)
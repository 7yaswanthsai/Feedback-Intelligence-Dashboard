from openpyxl.worksheet.dimensions import SheetDimension
import math
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from .database import SessionLocal
from statistics import stdev
from .models import Feedback, Session as SessionModel, Mentor, Cohort, Program

def get_analytics(program=None, cohort=None, mentor=None):
    db = SessionLocal()

    # Get full KPI data
    full_kpis = calculate_mentor_kpis()

    # Apply scope filtering
    if mentor:
        try:
            mentor_id = int(mentor)
            full_kpis = [m for m in full_kpis if m["mentor_id"] == mentor_id]
        except ValueError:
            full_kpis = []

    if program or cohort:
        scoped_query = (
            db.query(Mentor.id)
            .join(SessionModel, SessionModel.mentor_id == Mentor.id)
            .join(Cohort, SessionModel.cohort_id == Cohort.id)
            .join(Program, Cohort.program_id == Program.id)
        )

        if program:
            scoped_query = scoped_query.filter(Program.name == program)

        if cohort:
            scoped_query = scoped_query.filter(Cohort.name == cohort)

        valid_ids = {row[0] for row in scoped_query.all()}

        full_kpis = [m for m in full_kpis if m["mentor_id"] in valid_ids]

    # Institutional average (scoped)
    ratings_query = (
        db.query(func.avg(Feedback.rating_numeric))
        .join(SessionModel)
        .join(Cohort)
        .join(Program)
    )

    if program:
        ratings_query = ratings_query.filter(Program.name == program)

    if cohort:
        ratings_query = ratings_query.filter(Cohort.name == cohort)

    overall_avg = ratings_query.scalar() or 0

    # Scoped feedback count — counts only feedback within the filtered scope
    count_query = (
        db.query(func.count(Feedback.id))
        .join(SessionModel, Feedback.session_id == SessionModel.id)
        .join(Cohort, SessionModel.cohort_id == Cohort.id)
        .join(Program, Cohort.program_id == Program.id)
    )

    if program:
        count_query = count_query.filter(Program.name == program)

    if cohort:
        count_query = count_query.filter(Cohort.name == cohort)

    scoped_feedback_count = count_query.scalar() or 0

    db.close()

    return {
        "scope": {
            "program": program,
            "cohort": cohort,
            "mentor": mentor
        },
        "overall_avg_rating": round(float(overall_avg), 2),
        "total_feedback_count": int(scoped_feedback_count),
        "mentor_breakdown": full_kpis
    }

def calculate_mentor_kpis():
    db: Session = SessionLocal()

    #Overall stats for 1-score
    overall_stats = db.query(
        func.avg(Feedback.rating_numeric),
        func.stddev_pop(Feedback.rating_numeric)
    ).one()

    overall_avg = float(overall_stats[0])
    overall_std = float(overall_stats[1]) if overall_stats[1] else 1

    # Base mentor stats
    results = (
        db.query(
            Mentor.id,
            Mentor.name,
            func.avg(Feedback.rating_numeric).label("avg_rating"),
            func.count(Feedback.id).label("feedback_count"),
            func.stddev_pop(Feedback.rating_numeric).label("rating_stddev")
        )
        .join(SessionModel, SessionModel.mentor_id == Mentor.id)
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .group_by(Mentor.id)
        .all()
    )

    mentor_scores = []

    for row in results:
        avg_rating = float(row.avg_rating)
        feedback_count = row.feedback_count
        stddev = float(row.rating_stddev) if row.rating_stddev else 0

        # ------------------------
        # 1. Quality
        Q = (avg_rating - 1) / 4
        Q = max(0, min(Q, 1))

        # ------------------------
        # 2. Consistency
        C = 1 - (stddev / 2)
        C = max(0, min(C, 1))

        # ------------------------
        # 3. Reliability
        R = 1 - math.exp(-feedback_count / 1000)

        # ------------------------
        # 4. Trend (last 4 weeks)
        weekly_data = (
            db.query(
                SessionModel.week_number,
                func.avg(Feedback.rating_numeric)
            )
            .join(Feedback, Feedback.session_id == SessionModel.id)
            .filter(SessionModel.mentor_id == row.id)
            .group_by(SessionModel.week_number)
            .order_by(SessionModel.week_number.desc())
            .limit(4)
            .all()
        )

        slope = 0
        if len(weekly_data) >= 2:
            weeks = [w[0] for w in weekly_data]
            ratings = [float(w[1]) for w in weekly_data]

            x_mean = sum(weeks) / len(weeks)
            y_mean = sum(ratings) / len(ratings)

            numerator = sum((weeks[i] - x_mean) * (ratings[i] - y_mean) for i in range(len(weeks)))
            denominator = sum((weeks[i] - x_mean) ** 2 for i in range(len(weeks)))

            slope = numerator / denominator if denominator != 0 else 0

        T = max(-1, min(slope * 6, 1))

        # ------------------------
        # 5. Z-score
        Z = (avg_rating - overall_avg) / overall_std if overall_std != 0 else 0

        # ------------------------
        # Composite MPI
        MPI = 0.45 * Q + 0.2 * C + 0.2 * R + 0.15 * T

        # Confidence
        confidence = C * R

        # ------------------------
        # Classification
        if MPI >= 0.72 and Z > 0:
            category = "Top Performer"
        elif MPI < 0.55 or Z < -1.5:
            category = "At Risk"
        elif C < 0.5 and avg_rating > 3.5:
            category = "High Volatility"
        elif MPI < 0.65:
            category = "Needs Attention"
        else:
            category = "Stable"

        mentor_scores.append({
            "mentor_id": row.id,
            "mentor_name": row.name,
            "avg_rating": round(avg_rating, 2),
            "rating_stddev": round(stddev, 2),
            "feedback_count": feedback_count,

            "quality_score": round(Q, 3),
            "consistency_score": round(C, 3),
            "reliability_score": round(R, 3),
            "trend_score": round(T, 3),

            "mpi_score": round(MPI, 3),
            "confidence_score": round(confidence, 3),
            "z_score": round(Z, 2),
            "category": category
        })

    db.close()

    mentor_scores.sort(key=lambda x: x["mpi_score"], reverse=True)

    return mentor_scores

def detect_trends():
    db: Session = SessionLocal()

    weekly_data = (
        db.query(
            SessionModel.mentor_id,
            SessionModel.week_number,
            func.avg(Feedback.rating_numeric).label("avg_rating")
        )
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .group_by(SessionModel.mentor_id, SessionModel.week_number)
        .all()
    )

    trend_map = {}

    for row in weekly_data:
        mentor_id = row.mentor_id
        if mentor_id not in trend_map:
            trend_map[mentor_id] = []

        trend_map[mentor_id].append((row.week_number, float(row.avg_rating)))

    alerts = []

    for mentor_id, weeks in trend_map.items():
        weeks.sort(key=lambda x: x[0])

        if len(weeks) >= 2:
            last_week = weeks[-1][1]
            prev_week = weeks[-2][1]

            if prev_week - last_week > 0.7:
                alerts.append({
                    "mentor_id": mentor_id,
                    "issue": "Recent Rating Drop",
                    "drop_amount": round(prev_week - last_week, 2)
                })

    db.close()
    return alerts

def generate_executive_insights():
    mentor_data = calculate_mentor_kpis()
    insights = []

    for mentor in mentor_data:
        name = mentor["mentor_name"]
        avg = mentor["avg_rating"]
        std = mentor["rating_stddev"]
        category = mentor["category"]

        if category == "Top Performer":
            insight = (
                f"{name} consistently delivers outstanding sessions "
                f"with an average rating of {avg} and strong stability. "
                f"Consider positioning as a benchmark mentor."
            )

        elif category == "At Risk":
            insight = (
                f"{name} has a low average rating of {avg}. "
                f"Immediate intervention and mentoring review recommended."
            )

        elif category == "High Volatility":
            insight = (
                f"{name} shows inconsistent performance (std dev {std}). "
                f"Investigate factors causing rating fluctuations."
            )

        elif category == "Needs Attention":
            insight = (
                f"{name}'s ratings are slightly below expectations. "
                f"Monitoring and feedback discussion advised."
            )

        else:
            insight = (
                f"{name} maintains stable performance with an average rating of {avg}."
            )

        insights.append({
            "mentor_name": name,
            "category": category,
            "insight": insight
        })

    return insights

def get_mentor_trends():
    db = SessionLocal()

    results = (
        db.query(
            Mentor.id.label("mentor_id"),
            Mentor.name.label("mentor_name"),
            SessionModel.week_number,
            func.avg(Feedback.rating_numeric).label("avg_rating"),
        )
        .join(SessionModel, SessionModel.mentor_id == Mentor.id)
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .group_by(Mentor.id, Mentor.name, SessionModel.week_number)
        .order_by(Mentor.id, SessionModel.week_number)
        .all()
    )

    trends = [
        {
            "mentor_id": r.mentor_id,
            "mentor_name": r.mentor_name,
            "week_number": r.week_number,
            "avg_rating": round(float(r.avg_rating), 2),
        }
        for r in results
    ]

    db.close()
    return trends

def get_mentor_feedback_intelligence(mentor_id: int):
    db = SessionLocal()

    # ----------------------------
    # Rating distribution
    rating_rows = (
        db.query(
            Feedback.rating_numeric,
            func.count(Feedback.id)
        )
        .join(SessionModel, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .group_by(Feedback.rating_numeric)
        .all()
    )

    rating_distribution = {str(int(r[0])): r[1] for r in rating_rows}

    # ----------------------------
    # Weekly average rating
    weekly_avg_rows = (
        db.query(
            SessionModel.week_number,
            func.avg(Feedback.rating_numeric)
        )
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .group_by(SessionModel.week_number)
        .order_by(SessionModel.week_number)
        .all()
    )

    weekly_avg = [
        {
            "week": r[0],
            "avg_rating": round(float(r[1]), 2)
        }
        for r in weekly_avg_rows
    ]

    # ----------------------------
    # Weekly feedback volume
    weekly_volume_rows = (
        db.query(
            SessionModel.week_number,
            func.count(Feedback.id)
        )
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .group_by(SessionModel.week_number)
        .order_by(SessionModel.week_number)
        .all()
    )

    weekly_volume = [
        {
            "week": r[0],
            "count": r[1]
        }
        for r in weekly_volume_rows
    ]

    # ----------------------------
    # Weekly attendance (distinct students per week)
    weekly_attendance_rows = (
        db.query(
            SessionModel.week_number,
            func.count(func.distinct(Feedback.student_id)).label("attendance")
        )
        .join(Feedback, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .group_by(SessionModel.week_number)
        .order_by(SessionModel.week_number)
        .all()
    )

    weekly_attendance = [
        {
            "week": r.week_number,
            "attendance": r.attendance
        }
        for r in weekly_attendance_rows
    ]

    # ----------------------------
    # Total unique students
    total_students = (
        db.query(func.count(func.distinct(Feedback.student_id)))
        .join(SessionModel, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .scalar()
    )

    # ----------------------------
    # Total sessions conducted
    total_sessions = (
        db.query(func.count(func.distinct(SessionModel.id)))
        .filter(SessionModel.mentor_id == mentor_id)
        .scalar()
    )

    db.close()

    return {
        "rating_distribution": rating_distribution,
        "weekly_avg": weekly_avg,
        "weekly_volume": weekly_volume,
        "weekly_attendance": weekly_attendance,
        "total_students": total_students or 0,
        "total_sessions": total_sessions or 0
    }

def get_mentor_comments(mentor_id: int, limit: int = 20):
    db = SessionLocal()

    rows = (
        db.query(
            Feedback.comment,
            Feedback.structured_response,
            Feedback.rating_numeric,
            Feedback.submitted_at,
        )
        .join(SessionModel, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .filter(Feedback.comment != None)
        .filter(Feedback.comment != "")
        .order_by(Feedback.submitted_at.desc())
        .limit(limit)
        .all()
    )

    db.close()

    return [
        {
            "comment": r.comment,
            "structured_response": r.structured_response,
            "rating": float(r.rating_numeric) if r.rating_numeric else None,
            "submitted_at": r.submitted_at.isoformat() if r.submitted_at else None,
        }
        for r in rows
    ]
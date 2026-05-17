from google import genai
from .kpi_service import calculate_mentor_kpis
from .database import SessionLocal
from .models import Feedback, Session as SessionModel
from dotenv import load_dotenv
from pathlib import Path
import os

# Force loading .env from project root
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    raise ValueError("GOOGLE_API_KEY not found")

client = genai.Client(api_key=api_key)

# Simple in-memory cache
brief_cache = {}

def generate_mentor_brief(mentor_id: int):

    # Return cached version if already generated
    if mentor_id in brief_cache:
        return {
            "mentor_id": mentor_id,
            "brief": brief_cache[mentor_id]
        }

    mentor_data = calculate_mentor_kpis()

    if not mentor_data:
        return {
            "mentor_id": mentor_id,
            "brief": "No mentor KPI data available."
        }

    mentor = next((m for m in mentor_data if m["mentor_id"] == mentor_id), None)

    if not mentor:
        return {"error": "Mentor not found"}

    institutional_avg = sum([m["avg_rating"] for m in mentor_data]) / len(mentor_data)
    rank = sorted(mentor_data, key=lambda x: x["mpi_score"], reverse=True).index(mentor) + 1
    total = len(mentor_data)

    # Fetch real student comments for this mentor
    db = SessionLocal()
    comment_rows = (
        db.query(Feedback.comment)
        .join(SessionModel, Feedback.session_id == SessionModel.id)
        .filter(SessionModel.mentor_id == mentor_id)
        .filter(Feedback.comment != None)
        .filter(Feedback.comment != "")
        .limit(50)
        .all()
    )
    db.close()
    comment_list = "\n".join(f"- {r[0]}" for r in comment_rows) if comment_rows else "No comments available."

    prompt = f"""
You are an executive analytics strategist specializing in performance intelligence.

Generate a structured executive intelligence brief using the following mentor data.

Quantitative Metrics:
Name: {mentor["mentor_name"]}
MPI: {mentor["mpi_score"]}
Category: {mentor["category"]}
Confidence: {mentor["confidence_score"]}
Trend Score: {mentor["trend_score"]}
Quality Score: {mentor["quality_score"]}
Consistency Score: {mentor["consistency_score"]}
Reliability Score: {mentor["reliability_score"]}
Average Rating: {mentor["avg_rating"]}
Institutional Average Rating: {institutional_avg}
Rank: {rank} out of {total}

Student Feedback Comments:
{comment_list}

Instructions:
- Base analysis strictly on provided metrics and comments.
- Extract recurring positive themes from student feedback.
- Extract recurring improvement themes from student feedback.
- Convert themes into strategic but practical guidance.
- Do not hallucinate information not present in data.

Return output strictly in structured sections:

1. Executive Snapshot
2. Strength Signals (from metrics + feedback themes)
3. Improvement Signals (from metrics + feedback themes)
4. Student Voice & Feedback Themes
5. Momentum & Outlook
6. Strategic Recommendation (clear, practical actions)

Tone:
Analytical, structured, executive-level, but actionable.
Avoid generic corporate filler.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        brief_text = response.text if response.text else "No AI response generated."

        # Save to cache so it doesn't call Gemini again
        brief_cache[mentor_id] = brief_text

        return {
            "mentor_id": mentor_id,
            "brief": brief_text
        }

    except Exception as e:
        print("AI ERROR:", e)

        return {
            "mentor_id": mentor_id,
            "brief": "AI quota exceeded or generation failed. Please try again later."
        }
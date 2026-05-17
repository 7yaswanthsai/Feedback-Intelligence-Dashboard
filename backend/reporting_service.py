from sqlalchemy import text
from .database import engine


def get_flat_feedback_data():
    query = """
    SELECT
        i.name AS institution,
        p.name AS program,
        c.name AS cohort,
        s.topic,
        s.week_number,
        s.session_date,
        m.name AS mentor,
        st.name AS student_name,
        st.email,
        f.rating_numeric,
        f.structured_response,
        f.comment,
        f.submitted_at,
        f.collected_at
    FROM feedback f
    JOIN students st ON f.student_id = st.id
    JOIN sessions s ON f.session_id = s.id
    JOIN mentors m ON s.mentor_id = m.id
    JOIN cohorts c ON s.cohort_id = c.id
    JOIN programs p ON c.program_id = p.id
    JOIN institutions i ON p.institution_id = i.id
    """

    with engine.connect() as conn:
        result = conn.execute(text(query))
        columns = result.keys()
        rows = result.fetchall()

    return [dict(zip(columns, row)) for row in rows]
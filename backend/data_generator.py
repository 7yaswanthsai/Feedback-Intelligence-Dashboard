import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import Institution, Program, Cohort, Mentor, Student, Session as SessionModel, Feedback


def generate_data():
    db: Session = SessionLocal()

    # Institution
    institution = Institution(name="Futurense Institute")
    db.add(institution)
    db.commit()
    db.refresh(institution)

    # Programs
    program_names = ["AI & ML", "Data Engineering", "MBA Analytics"]
    programs = []

    for name in program_names:
        p = Program(name=name, institution_id=institution.id)
        db.add(p)
        programs.append(p)

    db.commit()

    # Cohorts
    cohorts = []
    for p in programs:
        for i in range(1, 3):
            c = Cohort(name=f"{p.name} Cohort {i}", year=2026, program_id=p.id)
            db.add(c)
            cohorts.append(c)

    db.commit()

    # Mentors
    mentor_names = [
        "Rohan Das", "Anjali Nair", "Vikram Singh", "Priya Menon",
        "Karthik Rao", "Sneha Iyer", "Arjun Patel", "Meera Joshi"
    ]

    mentors = []
    for name in mentor_names:
        m = Mentor(name=name)
        db.add(m)
        mentors.append(m)

    db.commit()

    # Students
    students = []
    for i in range(300):
        cohort = random.choice(cohorts)
        s = Student(
            name=f"Student {i}",
            email=f"student{i}@mail.com",
            cohort_id=cohort.id
        )
        db.add(s)
        students.append(s)

    db.commit()

    # Sessions
    sessions = []
    base_date = datetime.now() - timedelta(days=90)

    for cohort in cohorts:
        for week in range(1, 11):
            mentor = random.choice(mentors)
            session = SessionModel(
                topic=f"Week {week} Topic",
                week_number=week,
                session_date=base_date + timedelta(days=week * 7),
                cohort_id=cohort.id,
                mentor_id=mentor.id
            )
            db.add(session)
            sessions.append(session)

    db.commit()

    # Feedback
    comments_positive = ["Great session", "Very clear explanation", "Loved the pace", "Excellent mentor"]
    comments_negative = ["Too fast", "Not clear", "Needs better examples", "Session felt rushed"]
    comments_neutral = ["Average session", "Okay overall", "Could improve"]

    base_time = datetime.now()

    for i in range(15000):
        student = random.choice(students)
        session = random.choice(sessions)

        mentor_id = session.mentor_id

        # Controlled performance patterns
        if mentor_id == 1:
            rating = round(random.normalvariate(4.6, 0.3), 1)
        elif mentor_id == 4:
            rating = round(random.normalvariate(2.8, 0.6), 1)
        elif mentor_id == 6:
            if random.random() < 0.5:
                rating = round(random.normalvariate(4.5, 0.4), 1)
            else:
                rating = round(random.normalvariate(2.5, 0.5), 1)
        else:
            rating = round(random.normalvariate(4, 0.5), 1)

        rating = max(1, min(5, rating))

        if rating >= 4:
            comment = random.choice(comments_positive)
        elif rating >= 3:
            comment = random.choice(comments_neutral)
        else:
            comment = random.choice(comments_negative)

        if rating >= 4.5:
            structured = "Excellent"
        elif rating >= 4:
            structured = "Good"
        elif rating >= 3:
            structured = "Average"
        else:
            structured = "Poor"

        submitted_time = base_time + timedelta(seconds=i)
        collected_time = submitted_time + timedelta(seconds=1)

        feedback = Feedback(
            rating_numeric=rating,
            structured_response=structured,
            comment=comment,
            submitted_at=submitted_time,
            collected_at=collected_time,
            student_id=student.id,
            session_id=session.id
        )

        db.add(feedback)

    db.commit()
    db.close()

    print("Dummy data inserted successfully.")
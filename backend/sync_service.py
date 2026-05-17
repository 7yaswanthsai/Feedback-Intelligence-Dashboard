import gspread
from google.oauth2.service_account import Credentials
from sqlalchemy.orm import Session
from datetime import datetime
from .database import SessionLocal
from .models import Student, Mentor, Session as SessionModel, Feedback, Cohort, Program
from .logger import logger
from dateutil import parser

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]

SPREADSHEET_NAME = "Futurense Student Feedback Responses"
WORKSHEET_NAME = "Form Responses 1"


def get_sheet():
    creds = Credentials.from_service_account_file(
        "credentials.json",
        scopes=SCOPES
    )
    client = gspread.authorize(creds)
    sheet = client.open(SPREADSHEET_NAME).worksheet(WORKSHEET_NAME)
    return sheet


def normalize_keys(row):
    return {key.strip(): value for key, value in row.items()}


def sync_feedback():
    try:
        logger.info("Starting Google Sheets sync...")

        sheet = get_sheet()
        records = sheet.get_all_records()

        db: Session = SessionLocal()
        inserted_count = 0

        for raw_row in records:
            row = normalize_keys(raw_row)

            submitted_time = parser.parse(row["Timestamp"])

            # Duplicate check
            submitted_time = parser.parse(row["Timestamp"])

            existing = db.query(Feedback).filter(
                Feedback.submitted_at == submitted_time
            ).first()

            if existing:
                continue

            program_name = row["Program"].strip()
            cohort_name = row["Cohort"].strip()
            week_number = int(row["Meeting / Week"])

            # Extract hierarchy fields
            if not program_name:
                logger.warning("Skipping row with empty Program")
                continue
            

            # Find Program
            program = db.query(Program).filter(
                Program.name == program_name
            ).first()

            if not program:
                logger.warning(f"Program not found: {program_name}")
                continue

            # Find Cohort
            cohort = db.query(Cohort).filter(
                Cohort.name == cohort_name,
                Cohort.program_id == program.id
            ).first()

            if not cohort:
                logger.warning(f"Cohort not found: {cohort_name}")
                continue

            # Find Mentor
            mentor = db.query(Mentor).filter(
                Mentor.name == row["Instructor"].strip()
            ).first()

            if not mentor:
                logger.warning(f"Mentor not found: {row['Instructor']}")
                continue

            # Find Session
            session = db.query(SessionModel).filter(
                SessionModel.week_number == week_number,
                SessionModel.cohort_id == cohort.id,
                SessionModel.mentor_id == mentor.id
            ).first()

            if not session:
                logger.warning(
                    f"Session not found for program {program_name}, cohort {cohort_name}, week {week_number}, mentor {mentor.name}"
                )
                continue

            # Get or create student (AFTER cohort exists)
            student = db.query(Student).filter(
                Student.email == row["Email Address"]
            ).first()

            if not student:
                student = Student(
                    name=row["Student Name"],
                    email=row["Email Address"],
                    cohort_id=cohort.id
                )
                db.add(student)
                db.flush()  # better than commit inside loop

            # Create feedback
            feedback = Feedback(
                rating_numeric=float(row["Session Rating"]),
                structured_response=row["How was the session?"],
                comment=row["Any additional feedback"],
                submitted_at=submitted_time,
                collected_at=submitted_time,
                student_id=student.id,
                session_id=session.id
            )

            db.add(feedback)
            inserted_count += 1

        db.commit()
        db.close()

        logger.info(f"Google Sheets sync completed. Inserted: {inserted_count}")

    except Exception as e:
        logger.error(f"Google Sheets sync failed: {e}")
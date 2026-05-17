from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)

    programs = relationship("Program", back_populates="institution")


class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    institution_id = Column(Integer, ForeignKey("institutions.id"))

    institution = relationship("Institution", back_populates="programs")
    cohorts = relationship("Cohort", back_populates="program")


class Cohort(Base):
    __tablename__ = "cohorts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    year = Column(Integer)
    program_id = Column(Integer, ForeignKey("programs.id"))

    program = relationship("Program", back_populates="cohorts")
    students = relationship("Student", back_populates="cohort")
    sessions = relationship("Session", back_populates="cohort")


class Mentor(Base):
    __tablename__ = "mentors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)

    sessions = relationship("Session", back_populates="mentor")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True)
    cohort_id = Column(Integer, ForeignKey("cohorts.id"))

    cohort = relationship("Cohort", back_populates="students")
    feedback = relationship("Feedback", back_populates="student")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String)
    week_number = Column(Integer)
    session_date = Column(DateTime)

    cohort_id = Column(Integer, ForeignKey("cohorts.id"))
    mentor_id = Column(Integer, ForeignKey("mentors.id"))

    cohort = relationship("Cohort", back_populates="sessions")
    mentor = relationship("Mentor", back_populates="sessions")
    feedback = relationship("Feedback", back_populates="session")


class Feedback(Base):
    __tablename__ = "feedback"

    __table_args__ = (
        UniqueConstraint(
            "student_id",
            "session_id",
            "submitted_at",
            name="uq_feedback_unique"
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    rating_numeric = Column(Float)
    structured_response = Column(String)
    comment = Column(Text)

    submitted_at = Column(DateTime)
    collected_at = Column(DateTime)

    student_id = Column(Integer, ForeignKey("students.id"))
    session_id = Column(Integer, ForeignKey("sessions.id"))

    student = relationship("Student", back_populates="feedback")
    session = relationship("Session", back_populates="feedback")
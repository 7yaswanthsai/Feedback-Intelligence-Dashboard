# from .database import engine, Base
# from . import models
# from .data_generator import generate_data

# def reset_database():
#     Base.metadata.drop_all(bind=engine)
#     Base.metadata.create_all(bind=engine)

# if __name__ == "__main__":
#     reset_database()
#     generate_data()

from .kpi_service import calculate_mentor_kpis, generate_executive_insights
from fastapi import FastAPI

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    print("=== Mentor Rankings ===")
    scores = calculate_mentor_kpis()
    for s in scores:
        print(s)

    print("\n=== Executive Insights ===")
    insights = generate_executive_insights()
    for i in insights:
        print(i)

# from .database import engine, Base
# from .data_generator import generate_data
# from .logger import logger


# def reset_database():
#     logger.info("Dropping all tables...")
#     Base.metadata.drop_all(bind=engine)

#     logger.info("Creating all tables...")
#     Base.metadata.create_all(bind=engine)

#     logger.info("Generating dummy data...")
#     generate_data()

#     logger.info("Database reset complete.")


# if __name__ == "__main__":
#     reset_database()
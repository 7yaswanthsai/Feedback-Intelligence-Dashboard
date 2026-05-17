from openpyxl import Workbook
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:Yaswanthsai%4007@localhost:5432/feedback_db"

engine = create_engine(DATABASE_URL)

tables = [
    "institutions",
    "programs",
    "cohorts",
    "mentors",
    "students",
    "sessions",
    "feedback"
]

wb = Workbook()
wb.remove(wb.active)

with engine.connect() as conn:
    for table in tables:
        ws = wb.create_sheet(title=table)

        result = conn.execute(text(f"SELECT * FROM {table}"))

        # Convert to list before appending
        columns = list(result.keys())
        ws.append(columns)

        for row in result:
            ws.append(list(row))

file_path = "feedback_export.xlsx"
wb.save(file_path)

print("Export completed successfully.")
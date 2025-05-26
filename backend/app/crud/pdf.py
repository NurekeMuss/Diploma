from app.models import PDFReport
from sqlalchemy.orm import Session

def save_pdf_report(db: Session, user_id: int, filename: str, filepath: str):
    pdf = PDFReport(user_id=user_id, filename=filename, filepath=filepath)
    db.add(pdf)
    db.commit()
    db.refresh(pdf)
    return pdf
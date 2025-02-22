import os
from urllib.parse import unquote
from fpdf import FPDF
from fastapi import HTTPException, APIRouter
from fastapi.responses import FileResponse
from app.base.service import ADBService

router = APIRouter()

class ReportGenerator:
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    OUTPUT_DIR = os.path.join(PROJECT_ROOT, "sorted_output")
    IMAGES_DIR = os.path.join(OUTPUT_DIR, "images")
    REPORT_DIR = os.path.join(OUTPUT_DIR, "media_report")

    @staticmethod
    def setup_directories():
        os.makedirs(ReportGenerator.IMAGES_DIR, exist_ok=True)
        os.makedirs(ReportGenerator.REPORT_DIR, exist_ok=True)

    @staticmethod
    def download_photos_from_camera(limit=100):
        photos = ADBService.list_files().get("photos", [])
        camera_photos = [photo for photo in photos if "/DCIM/Camera/" in photo.get("url", "")]

        if not camera_photos:
            raise HTTPException(status_code=404, detail="Фотографии из папки Camera не найдены на устройстве.")

        # Ограничиваем количество загружаемых фото первыми 100
        camera_photos = camera_photos[:limit]

        downloaded_files = []
        for photo in camera_photos:
            encoded_path = photo.get("url", "").split("path=")[-1]
            file_path = unquote(encoded_path)  # Декодирование URL-пути

            if not file_path:
                continue

            try:
                local_file = ADBService.download_file(file_path, ReportGenerator.IMAGES_DIR)
                downloaded_files.append(local_file)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Ошибка при скачивании файла '{file_path}': {str(e)}")

        if not downloaded_files:
            raise HTTPException(status_code=500, detail="Не удалось скачать ни одного файла из папки Camera.")

        return downloaded_files

    @staticmethod
    def generate_pdf_report(image_files: list):
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)

        for image_path in image_files:
            pdf.add_page()
            pdf.set_font("Arial", size=12)
            filename = os.path.basename(image_path)
            pdf.cell(200, 10, txt=f"Filename: {filename}", ln=True)

            try:
                pdf.image(image_path, x=10, y=30, w=180)
            except RuntimeError:
                pdf.cell(200, 10, txt="Ошибка при загрузке изображения.", ln=True)

        report_path = os.path.join(ReportGenerator.REPORT_DIR, "media_report.pdf")
        pdf.output(report_path)
        return report_path

    @staticmethod
    def create_camera_media_report(limit=100):
        ReportGenerator.setup_directories()
        images = ReportGenerator.download_photos_from_camera(limit=limit)
        return ReportGenerator.generate_pdf_report(images)

# Эндпоинты FastAPI

@router.post("/report/generate/camera")
def generate_camera_report(limit: int = 100):
    """Генерирует PDF-отчет с первыми 100 (по умолчанию) фотографиями из папки Camera."""
    try:
        report_path = ReportGenerator.create_camera_media_report(limit=limit)
        return {"message": "Отчет успешно создан.", "report_path": report_path}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации отчета: {str(e)}")

@router.get("/report/download")
def download_report():
    """Позволяет скачать сгенерированный PDF-отчет."""
    report_path = os.path.join(ReportGenerator.REPORT_DIR, "media_report.pdf")

    if os.path.exists(report_path):
        return FileResponse(report_path,
                            media_type="application/pdf",
                            headers={"Content-Disposition": "attachment; filename=media_report.pdf"})
    else:
        raise HTTPException(status_code=404, detail="Отчет не найден. Сначала сгенерируйте его.")

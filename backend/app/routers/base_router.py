from fastapi import APIRouter, HTTPException
from app.base.service import ADBService
from app.base.reportGenerator import ReportGenerator
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/")
def get_device_info():
    return ADBService.get_device_info()

@router.get("/all-files")
def get_adb_files():
    return ADBService.list_files()

@router.get("/download-file")
def download_adb_file(path: str):
    """Загружает файл с устройства и отправляет пользователю для скачивания."""
    try:
        local_file_path = ADBService.download_file(path)  # Скачиваем файл с устройства на сервер

        if not os.path.exists(local_file_path):
            raise HTTPException(status_code=404, detail="Файл не найден на сервере после скачивания.")

        return FileResponse(
            local_file_path,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f"attachment; filename={os.path.basename(local_file_path)}"}
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")

    
@router.post("/report/generate/{category}")
def generate_report(category: str, filter_path: str, limit: int = 10):
    """
    Генерирует отчет по категории с фильтрацией по пути и сразу отправляет клиенту.
    """
    try:
        file_paths = ReportGenerator.fetch_files_from_path(category, filter_path, limit)
        report_path = ReportGenerator.generate_pdf(file_paths)

        return FileResponse(
            report_path,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={category}_report.pdf"}
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации отчета: {str(e)}")

@router.get("/call_logs")
def get_call_logs():
    return ADBService.get_call_logs()
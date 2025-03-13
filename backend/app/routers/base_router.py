from fastapi import APIRouter, HTTPException
from app.base.service import ADBService
from app.base.reportGenerator import ReportGenerator
from fastapi.responses import FileResponse
import os

router = APIRouter()

BASE_OUTPUT_DIR = "output"
REPORTS_DIR = os.path.join(BASE_OUTPUT_DIR, "reports")

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

@router.get("/sms")
def get_sms():
    return ADBService.get_sms_messages()

@router.get("/system-info")
def get_system_info():
    return ADBService.get_system_info()

@router.post("/report/calls/from_json")
def generate_calls_report_from_json(call_logs: list[dict]):
    """Генерирует PDF-отчет по звонкам из JSON-данных, переданных в запросе."""
    try:
        report_path = ReportGenerator.generate_calls_report_from_json(call_logs)
        return FileResponse(
            report_path,
            media_type="application/pdf",
            filename="calls_report.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации отчета: {str(e)}")

from fastapi import Query

@router.get("/report/messages")
def generate_messages_report(
    contact: str = Query(None, description="Фильтр по номеру контакта"),
    date: str = Query(None, description="Фильтр по дате (формат YYYY-MM-DD)")
):
    """Генерирует и возвращает PDF-отчет по SMS-сообщениям с учетом фильтрации."""
    try:
        sms_messages = ADBService.get_sms_messages().get("sms_messages", [])
        if not sms_messages:
            raise HTTPException(status_code=404, detail="Данные о сообщениях не найдены.")

        # Фильтрация сообщений
        filtered_messages = [
            msg for msg in sms_messages
            if (not contact or contact in msg.get("Номер", "")) and
               (not date or msg.get("Дата", "").startswith(date))
        ]

        if not filtered_messages:
            raise HTTPException(status_code=404, detail="Нет сообщений, соответствующих фильтру.")

        report_path = ReportGenerator.generate_messages_report(filtered_messages)

        return FileResponse(
            report_path,
            media_type="application/pdf",
            filename="messages_report.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при генерации отчета: {str(e)}")

from fastapi import APIRouter
from app.base.service import ADBService
from fastapi.responses import FileResponse
import os

router = APIRouter()

@router.get("/")
def get_adb_devices():
    return ADBService.get_devices()

@router.get("/files")
def get_adb_files():
    return ADBService.list_files()

@router.get("/files/download")
def download_adb_file(path: str):
    """Загружает файл с устройства и отправляет пользователю для скачивания"""
    local_file_path = ADBService.download_file(path)  # Скачиваем файл с устройства на сервер
    if os.path.exists(local_file_path):
        return FileResponse(local_file_path, headers={"Content-Disposition": f"attachment; filename={os.path.basename(local_file_path)}"})
    else:
        raise HTTPException(status_code=404, detail="Файл не найден")
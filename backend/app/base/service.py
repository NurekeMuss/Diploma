import subprocess
import mimetypes
import urllib.parse
from fastapi import HTTPException
import os

class ADBService:
    @staticmethod
    def get_devices():
        """Получает список подключенных ADB-устройств"""
        try:
            result = subprocess.run(["adb", "devices"], capture_output=True, text=True)
            lines = result.stdout.split("\n")[1:-1]
            devices = [line.split("\t")[0] for line in lines if "device" in line]
            return {"devices": devices}
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def list_files(path: str = "/sdcard/"):
        """Получает список файлов с категоризацией"""
        try:
            result = subprocess.run(
                ["adb", "shell", f"ls -R {path}"], capture_output=True, text=True, encoding="utf-8", errors="replace"
            )
            output = result.stdout.strip()

            if not output:
                return {"error": "Папка пуста или ADB не смог получить файлы."}

            if not output:
                return {"error": "No output from adb command"}

            files_dict = {"photos": [], "videos": [], "documents": [], "others": []}
            current_dir = path.rstrip("/")

            for line in output.split("\n"):
                if line.endswith(":"):  
                    current_dir = line[:-1]  
                else:
                    if line.strip():
                        file_path = f"{current_dir}/{line.strip()}"
                        category = ADBService.get_file_category(file_path)
                        file_url = f"/files/download?path={urllib.parse.quote(file_path)}"
                        files_dict[category].append({"name": line.strip(), "url": file_url})

            return files_dict
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def get_file_category(file_path: str):
        """Определяет категорию файла по MIME-типа"""
        mime_type, _ = mimetypes.guess_type(file_path)

        if mime_type:
            if mime_type.startswith("image/"):
                return "photos"
            elif mime_type.startswith("video/"):
                return "videos"
            elif mime_type in ["application/pdf", "application/msword"]:
                return "documents"

        return "others"

    @staticmethod
    def download_file(path: str, output_dir: str = "downloads/"):
        """Скачивает файл с устройства и сохраняет его на сервере""" 
        try:
            os.makedirs(output_dir, exist_ok=True)  # Создаем папку для скачивания, если ее нет
            local_file_path = os.path.join(output_dir, path.split("/")[-1])  # Имя файла на локальной машине
            subprocess.run(["adb", "pull", path, local_file_path], check=True)
            
            # Возвращаем путь к скачанному файлу
            return local_file_path
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Ошибка при скачивании файла: {str(e)}")
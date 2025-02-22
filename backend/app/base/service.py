import subprocess
import mimetypes
import urllib.parse
from fastapi import HTTPException
import os

class ADBService:
    base_path = "/sdcard/"
    download_url = "http://127.0.0.1:8000/download-file?path="

    @staticmethod
    def get_device_info():
        """Получает информацию о подключенных ADB-устройствах"""
        try:
            # Получаем список устройств
            result = subprocess.run(["adb", "devices"], capture_output=True, text=True)
            lines = result.stdout.split("\n")[1:-1]
            devices = [line.split("\t")[0] for line in lines if "device" in line]

            device_info = []
            for device in devices:
                info = {
                    "serial_number": subprocess.run(["adb", "-s", device, "get-serialno"], capture_output=True, text=True).stdout.strip(),
                    "brand": subprocess.run(["adb", "-s", device, "shell", "getprop", "ro.product.brand"], capture_output=True, text=True).stdout.strip(),
                    "device": subprocess.run(["adb", "-s", device, "shell", "getprop", "ro.product.device"], capture_output=True, text=True).stdout.strip(),
                    "model": subprocess.run(["adb", "-s", device, "shell", "getprop", "ro.product.model"], capture_output=True, text=True).stdout.strip(),
                    # "full_properties": subprocess.run(["adb", "-s", device, "shell", "getprop"], capture_output=True, text=True).stdout.strip(),
                }
                device_info.append(info)

            return {"device-info": device_info}
        except Exception as e:
            return {"error": str(e)}


    @staticmethod
    def get_file_category(file_path: str) -> str:
        """Категоризация файла по MIME-типу"""
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type:
            if mime_type.startswith("image/"):
                return "images"
            elif mime_type.startswith("video/"):
                return "videos"
            elif mime_type in ["application/pdf", "application/msword", 
                               "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                               "application/vnd.ms-excel", 
                               "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                               "text/plain"]:
                return "documents"
        return "others"

    @classmethod
    def list_files(cls, directory: str = ""):
        """Синхронно получает список файлов из указанной директории (по умолчанию /sdcard/)"""
        full_path = os.path.join(cls.base_path, directory.strip("/"))
        return cls._list_files(full_path, recursive=(directory == ""))

    @classmethod
    def _list_files(cls, path: str, recursive: bool):
        """Вспомогательная функция для получения списка файлов"""
        command = f"ls -R {path}" if recursive else f"ls {path}"
        try:
            result = subprocess.run(
                ["adb", "shell", command], capture_output=True, text=True, encoding="utf-8", errors="replace"
            )
            output = result.stdout.strip()

            if not output:
                return {"error": f"Папка {path} пуста или ADB не смог получить файлы."}

            files_dict = {"images": [], "videos": [], "documents": [], "others": []}
            current_dir = path.rstrip("/")

            for line in output.split("\n"):
                if recursive and line.endswith(":"):  
                    current_dir = line[:-1]  
                elif line.strip():  
                    file_path = f"{current_dir}/{line.strip()}"
                    category = cls.get_file_category(file_path)
                    file_url = f"{cls.download_url}{urllib.parse.quote(file_path)}"
                    files_dict[category].append({"name": line.strip(), "url": file_url})

            return files_dict
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def download_file(path: str, output_dir: str = "downloads/"):
        """Скачивает файл с устройства и сохраняет его на сервере""" 
        try:
            os.makedirs(output_dir, exist_ok=True)  # Создаем папку для скачивания, если ее нет
            local_file_path = os.path.join(output_dir, os.path.basename(path))  # Имя файла на локальной машине
            subprocess.run(["adb", "pull", path, local_file_path], check=True)
            
            # Возвращаем путь к скачанному файлу
            return local_file_path
        except subprocess.CalledProcessError as e:
            raise HTTPException(status_code=500, detail=f"Ошибка при скачивании файла: {str(e)}")

import subprocess
import mimetypes
import urllib.parse
from fastapi import HTTPException
import os
import re
from datetime import datetime

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
            
    @staticmethod
    def get_call_logs():
        try:
            # Выполняем команду ADB для получения данных звонков
            result = subprocess.run(
                ["adb", "shell", "content", "query", "--uri", "content://call_log/calls"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore"
            )

            if result.returncode != 0:
                return {"error": "Ошибка при выполнении ADB команды", "details": result.stderr}

            raw_data = result.stdout.strip().split("\n")
            parsed_logs = [ADBService.parse_call_log(log) for log in raw_data if log.strip()]
            return {"call_logs": parsed_logs}

        except Exception as e:
            return {"error": "Ошибка обработки", "details": str(e)}

    @staticmethod
    def parse_call_log(log: str):
        log_dict = dict(re.findall(r"(\w+)=([^,]+)", log))
        
        # Преобразуем timestamp в нормальную дату
        timestamp = log_dict.get("date", "0")
        formatted_date = (
            datetime.fromtimestamp(int(timestamp) / 1000).strftime('%Y-%m-%d %H:%M:%S') 
            if timestamp.isdigit() else "Неизвестно"
        )

        # Читаемые типы звонков
        call_types = {
            "1": "Входящий",
            "2": "Исходящий",
            "3": "Пропущенный",
            "4": "Голосовая почта",
            "5": "Отклонённый",
            "6": "Заблокированный",
            "7": "Внешне отвеченный"
        }

        # Читаемые причины блокировки
        block_reasons = {
            "0": "Нет блокировки",
            "1": "Заблокирован пользователем",
            "2": "Фильтрация спама",
            "3": "Системная блокировка"
        }

        return {
            "ID звонка": log_dict.get("_id", "Неизвестно"),
            "Номер": log_dict.get("number", "Неизвестно"),
            "Контакт": log_dict.get("name", "Неизвестно"),
            "Длительность": log_dict.get("duration", "0") + " сек",
            "Страна": log_dict.get("geocoded_location", "Неизвестно"),
            "Тип вызова": call_types.get(log_dict.get("type"), log_dict.get("type", "Неизвестный")),
            "Дата": formatted_date,
            "Новый вызов": "Да" if log_dict.get("new", "0") == "1" else "Нет",
            "Пропущенный": "Да" if log_dict.get("duration", "0") == "0" else "Нет",
            "SIM-карта (ID)": log_dict.get("subscription_id", "Неизвестно"),
            "Причина блокировки": block_reasons.get(log_dict.get("block_reason", "0"), "Неизвестно"),
            "Учётная запись телефона": log_dict.get("subscription_component_name", "Неизвестно")
        }

    @staticmethod
    def get_sms_messages():
        try:
            result = subprocess.run(
                ["adb", "shell", "content", "query", "--uri", "content://sms"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore"
            )

            if result.returncode != 0:
                return {"error": "Ошибка выполнения ADB команды", "details": result.stderr}

            raw_data = result.stdout.strip().split("\n")
            parsed_messages = [ADBService.parse_sms(log) for log in raw_data if log.strip()]
            return {"sms_messages": parsed_messages}

        except Exception as e:
            return {"error": "Ошибка обработки", "details": str(e)}

    @staticmethod
    def parse_sms(log: str):
        log_dict = dict(re.findall(r"(\w+)=([^,]+)", log))

        timestamp = log_dict.get("date", "0")
        formatted_date = datetime.fromtimestamp(int(timestamp) / 1000).strftime('%Y-%m-%d %H:%M:%S') if timestamp.isdigit() else "Неизвестно"

        sms_types = {
            "1": "Входящее",
            "2": "Исходящее"
        }

        return {
            "ID": log_dict.get("_id", "Неизвестно"),
            "Номер": log_dict.get("address", "Неизвестно"),
            "Текст": log_dict.get("body", "Неизвестно"),
            "Дата": formatted_date,
            "Тип": sms_types.get(log_dict.get("type", "1"), "Неизвестно")
        }
    
    @staticmethod 
    def get_system_info():
        """Получает системную информацию, сетевые данные, список приложений и GPS-координаты устройства"""
        try:
            # Получаем основную информацию
            system_info = {
                "device_name": subprocess.run(["adb", "shell", "getprop", "ro.product.model"], capture_output=True, text=True).stdout.strip(),
                "android_version": subprocess.run(["adb", "shell", "getprop", "ro.build.version.release"], capture_output=True, text=True).stdout.strip(),
                "battery": subprocess.run(["adb", "shell", "dumpsys", "battery"], capture_output=True, text=True).stdout.strip(),
                "storage": subprocess.run(["adb", "shell", "df", "/data"], capture_output=True, text=True).stdout.strip()
            }

            # Получаем GPS-координаты
            gps_output = subprocess.run(["adb", "shell", "dumpsys", "location"], capture_output=True, text=True).stdout.strip()
            gps_match = re.search(r"Latitude:\s+([-0-9.]+).*Longitude:\s+([-0-9.]+)", gps_output, re.DOTALL)
            system_info["gps_coordinates"] = {"latitude": gps_match.group(1), "longitude": gps_match.group(2)} if gps_match else "GPS данные не найдены или отключены."

            # Получаем сетевую информацию
            system_info["wifi_connections"] = subprocess.run(["adb", "shell", "dumpsys", "wifi"], capture_output=True, text=True).stdout.strip()
            system_info["ip_address"] = subprocess.run(["adb", "shell", "ip", "a"], capture_output=True, text=True).stdout.strip()
            system_info["mobile_operator"] = subprocess.run(["adb", "shell", "getprop", "gsm.operator.alpha"], capture_output=True, text=True).stdout.strip()
            system_info["network_status"] = subprocess.run(["adb", "shell", "dumpsys", "telephony.registry"], capture_output=True, text=True).stdout.strip()

            # Получаем список установленных приложений
            system_info["installed_apps"] = subprocess.run(["adb", "shell", "pm", "list", "packages"], capture_output=True, text=True).stdout.strip()

            return system_info
        
        except Exception as e:
            return {"error": str(e)}

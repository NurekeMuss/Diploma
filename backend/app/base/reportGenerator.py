import os
import re
from urllib.parse import unquote
from fpdf import FPDF
from fastapi import HTTPException
from app.base.service import ADBService

class ReportGenerator:
    BASE_OUTPUT_DIR = "output"
    REPORTS_DIR = os.path.join(BASE_OUTPUT_DIR, "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)

    @staticmethod
    def fetch_files_from_path(category: str, directory: str, limit: int) -> list:
        """Скачивает файлы указанной категории только из указанной директории."""
        files = ADBService.list_files(directory).get(category, [])
        
        if not files:
            raise HTTPException(status_code=404, detail=f"Файлы категории '{category}' не найдены в '{directory}'.")

        output_dir = os.path.join(ReportGenerator.BASE_OUTPUT_DIR, category)
        os.makedirs(output_dir, exist_ok=True)

        downloaded_files = []
        for file in files[:limit]:
            encoded_path = file.get("url", "").split("path=")[-1]
            file_path = unquote(encoded_path)

            if not file_path:
                continue

            try:
                local_file = ADBService.download_file(file_path, output_dir)
                downloaded_files.append(local_file)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Ошибка при скачивании '{file_path}': {str(e)}")

        if not downloaded_files:
            raise HTTPException(status_code=500, detail=f"Не удалось скачать файлы категории '{category}' из '{directory}'.")

        return downloaded_files

    @staticmethod
    def generate_pdf(file_paths: list) -> str:
        """Создает PDF-отчет и сохраняет его в output/reports/."""
        report_path = os.path.join(ReportGenerator.REPORTS_DIR, f"{file_paths[0].split(os.sep)[-2]}_report.pdf")

        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font("Arial", size=12)

        for file_path in file_paths:
            pdf.add_page()
            filename = os.path.basename(file_path)
            pdf.cell(200, 10, txt=f"Filename: {filename}", ln=True)

            try:
                pdf.image(file_path, x=10, y=30, w=180)
            except RuntimeError:
                pdf.cell(200, 10, txt="Ошибка загрузки изображения", ln=True)

        pdf.output(report_path)
        return report_path

    @staticmethod
    def setup_pdf():
        """Настраивает PDF с поддержкой Unicode."""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        
        pdf.add_font("DejaVu", "", "fonts/DejaVuSans.ttf", uni=True)
        pdf.set_font("DejaVu", "", 12)
        
        return pdf

    @staticmethod
    def remove_emojis(text):
        """Удаляет эмодзи из текста."""
        emoji_pattern = re.compile("[\U00010000-\U0010ffff]", flags=re.UNICODE)
        return emoji_pattern.sub("?", text)  

    @staticmethod
    def generate_messages_report(sms_messages: list) -> str:
        """Создает PDF-отчет по SMS и сохраняет его в output/reports."""
    
        try:
            if not sms_messages:
                print("[ERROR] Список сообщений пуст!")
                raise HTTPException(status_code=400, detail="Нет данных для генерации отчета.")

            print(f"[DEBUG] Количество сообщений: {len(sms_messages)}")

            for idx, msg in enumerate(sms_messages):
                print(f"[DEBUG] Сообщение {idx}: {repr(msg)}")

            pdf = ReportGenerator.setup_pdf()
            pdf.cell(200, 10, "Отчет по SMS-сообщениям", ln=True, align="C")
            pdf.ln(10)

            pdf.set_font("DejaVu", "", 10)
            pdf.cell(40, 10, "Дата", border=1)
            pdf.cell(50, 10, "Номер", border=1)
            pdf.cell(20, 10, "Тип", border=1)
            pdf.cell(80, 10, "Сообщение", border=1)
            pdf.ln()

            for idx, msg in enumerate(sms_messages):
                try:
                    if not isinstance(msg, dict):
                        print(f"[ERROR] Некорректный формат сообщения {idx}: {repr(msg)}")
                        continue
                    
                    дата = msg.get("Дата", "—")
                    номер = msg.get("Номер", "—")
                    тип = msg.get("Тип", "—")
                    текст = msg.get("Текст", "—")

                    if not all([дата, номер, тип, текст]):
                        print(f"[ERROR] Сообщение {idx} содержит пустые поля: {repr(msg)}")
                        continue

                    # Удаляем эмодзи
                    текст = ReportGenerator.remove_emojis(текст)

                    if len(текст) > 40:
                        текст = текст[:37] + "..."

                    pdf.cell(40, 10, дата, border=1)
                    pdf.cell(50, 10, номер, border=1)
                    pdf.cell(20, 10, тип, border=1)
                    pdf.cell(80, 10, текст, border=1)
                    pdf.ln()

                except Exception as e:
                    print(f"[ERROR] Ошибка при обработке сообщения {idx}: {e}")
                    continue  
                
            report_path = os.path.join(ReportGenerator.REPORTS_DIR, "messages_report.pdf")
            pdf.output(report_path, "F")
            return report_path

        except Exception as e:
            print(f"[CRITICAL ERROR] Ошибка при генерации отчета: {e}")
            raise HTTPException(status_code=500, detail=f"Ошибка при генерации отчета: {str(e)}")


    
    @staticmethod
    def generate_calls_report_from_json(call_logs: list) -> str:
        """Создает PDF-отчет по звонкам из переданных JSON-данных."""
        if not call_logs:
            raise HTTPException(status_code=400, detail="Нет данных для генерации отчета.")

        pdf = ReportGenerator.setup_pdf()
        pdf.cell(200, 10, "Отчет по звонкам", ln=True, align="C")
        pdf.ln(10)
        pdf.set_font("DejaVu", "", 10)

        # Заголовки таблицы
        pdf.cell(40, 10, "Дата", border=1)
        pdf.cell(40, 10, "Номер", border=1)
        pdf.cell(40, 10, "Тип вызова", border=1)
        pdf.cell(30, 10, "Длительность", border=1)
        pdf.cell(40, 10, "Статус", border=1)
        pdf.ln()

        for log in call_logs:
            pdf.cell(40, 10, log.get("Дата", "—"), border=1)
            pdf.cell(40, 10, log.get("Номер", "—"), border=1)
            pdf.cell(40, 10, log.get("Тип вызова", "—"), border=1)
            pdf.cell(30, 10, log.get("Длительность", "—"), border=1)
            pdf.cell(40, 10, "Пропущенный" if log.get("Пропущенный") == "Да" else "Принятый", border=1)
            pdf.ln()

        report_path = os.path.join(ReportGenerator.REPORTS_DIR, "calls_report.pdf")
        pdf.output(report_path, "F")
        return report_path
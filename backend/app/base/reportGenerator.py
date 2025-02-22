import os
from urllib.parse import unquote
from fpdf import FPDF
from fastapi import HTTPException
from app.base.service import ADBService

class ReportGenerator:
    BASE_OUTPUT_DIR = "output"

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
        report_path = os.path.join(ReportGenerator.BASE_OUTPUT_DIR, "reports", f"{file_paths[0].split(os.sep)[-2]}_report.pdf")
        os.makedirs(os.path.dirname(report_path), exist_ok=True)

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


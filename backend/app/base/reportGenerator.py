import os
import re
from urllib.parse import unquote
from fpdf import FPDF
from fastapi import HTTPException
from datetime import datetime
from app.base.service import ADBService
from typing import List, Optional

class ReportGenerator:
    BASE_OUTPUT_DIR = "output"
    REPORTS_DIR = os.path.join(BASE_OUTPUT_DIR, "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    # Color scheme for professional reports
    COLORS = {
        'primary': (0, 51, 102),       # Dark blue
        'secondary': (0, 102, 204),     # Medium blue
        'accent': (255, 153, 0),        # Orange
        'light': (240, 240, 240),       # Light gray
        'dark': (51, 51, 51),           # Dark gray
        'success': (0, 128, 0),         # Green
        'warning': (255, 204, 0),       # Yellow
        'danger': (204, 0, 0)           # Red
    }

    @staticmethod
    def setup_pdf(title: str = "Device Report"):
        """Initialize PDF with professional settings"""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # Add Unicode-compatible fonts (normal, bold, italic, bold-italic)
        pdf.add_font("DejaVu", "", "fonts/DejaVuSans.ttf", uni=True)
        pdf.add_font("DejaVu", "B", "fonts/DejaVuSans-Bold.ttf", uni=True)
        pdf.add_font("DejaVu", "I", "fonts/DejaVuSans-Oblique.ttf", uni=True)  # если нужен italic
        pdf.add_font("DejaVu", "BI", "fonts/DejaVuSans-BoldOblique.ttf", uni=True)  # если нужен bold italic


        # Add title and metadata
        pdf.set_title(title)
        pdf.set_author("Automated Report System")
        pdf.set_creator("ADB Report Module")

        return pdf

    @staticmethod
    def add_header(pdf, title):
        """Add professional header to PDF"""
        pdf.set_font("DejaVu", "B", 16)
        pdf.set_text_color(*ReportGenerator.COLORS['primary'])
        pdf.cell(0, 10, title, 0, 1, 'C')
        pdf.ln(5)
        
        # Add report metadata
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(*ReportGenerator.COLORS['dark'])
        pdf.cell(0, 6, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", 0, 1, 'R')
        pdf.ln(10)

    @staticmethod
    def add_device_info_section(pdf):
        """Add comprehensive device information section"""
        device_info = ADBService.get_device_info()
        
        if not device_info or "error" in device_info:
            return
        
        pdf.set_font("DejaVu", "B", 12)
        pdf.set_text_color(*ReportGenerator.COLORS['primary'])
        pdf.cell(0, 8, "Device Information", 0, 1)
        pdf.ln(2)
        
        # Add horizontal line
        pdf.set_draw_color(*ReportGenerator.COLORS['light'])
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)
        
        pdf.set_font("DejaVu", "", 10)
        pdf.set_text_color(*ReportGenerator.COLORS['dark'])
        
        for device in device_info.get("device-info", []):
            # Device summary box
            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            pdf.rect(10, pdf.get_y(), 190, 20, 'F')
            pdf.set_font("DejaVu", "B", 12)
            pdf.cell(0, 10, f"{device.get('brand', 'Unknown')} {device.get('model', 'Device')}", 0, 1)
            pdf.ln(12)
            
            # Detailed info
            pdf.set_font("DejaVu", "", 10)
            col_width = 90
            row_height = 8
            
            # Column 1
            pdf.cell(col_width, row_height, f"Serial Number: {device.get('serial_number', 'N/A')}", 0, 0)
            pdf.cell(col_width, row_height, f"Model: {device.get('model', 'N/A')}", 0, 1)
            pdf.cell(col_width, row_height, f"Brand: {device.get('brand', 'N/A')}", 0, 0)
            pdf.cell(col_width, row_height, f"Device: {device.get('device', 'N/A')}", 0, 1)
            pdf.ln(10)
            
            # Add system info if available
            system_info = ADBService.get_system_info()
            if system_info and "error" not in system_info:
                pdf.set_font("DejaVu", "B", 12)
                pdf.cell(0, 8, "System Information", 0, 1)
                pdf.ln(2)
                pdf.line(10, pdf.get_y(), 200, pdf.get_y())
                pdf.ln(5)
                
                pdf.set_font("DejaVu", "", 10)
                pdf.cell(col_width, row_height, f"Android Version: {system_info.get('android_version', 'N/A')}", 0, 0)
                pdf.cell(col_width, row_height, f"Device Name: {system_info.get('device_name', 'N/A')}", 0, 1)
                
                # Battery info
                battery_info = system_info.get('battery', '')
                battery_level = re.search(r'level: (\d+)', battery_info)
                battery_status = re.search(r'status: (\d+)', battery_info)
                status_map = {1: "Unknown", 2: "Charging", 3: "Discharging", 4: "Not charging", 5: "Full"}

                battery_text = f"Battery: {battery_level.group(1) + '%' if battery_level else 'N/A'}"
                if battery_status:
                    status = status_map.get(int(battery_status.group(1)), "Unknown")
                else:
                    status = "N/A"
                battery_text += f" ({status})"

                pdf.cell(col_width, row_height, battery_text, 0, 0)
                
                # Storage info
                storage_info = system_info.get('storage', '')
                storage_match = re.search(r'(\d+%)\s+/\s+(\S+)', storage_info)
                pdf.cell(col_width, row_height, 
                        f"Storage: {storage_match.group(1) if storage_match else 'N/A'} used", 
                        0, 1)
                
                # Network info
                pdf.ln(5)
                pdf.set_font("DejaVu", "B", 10)
                pdf.cell(0, 8, "Network Information", 0, 1)
                pdf.set_font("DejaVu", "", 10)
                
                operator = system_info.get('mobile_operator', 'N/A')
                pdf.cell(col_width, row_height, f"Mobile Operator: {operator}", 0, 1)
                
                # GPS coordinates
                gps = system_info.get('gps_coordinates', {})
                if isinstance(gps, dict):
                    pdf.cell(col_width, row_height, 
                            f"Last Known Location: {gps.get('latitude', 'N/A')}, {gps.get('longitude', 'N/A')}", 
                            0, 1)
                
                pdf.ln(10)

    @staticmethod
    def add_chapter_title(pdf, title):
        """Add styled chapter/section title"""
        pdf.set_font("DejaVu", "B", 14)
        pdf.set_text_color(*ReportGenerator.COLORS['secondary'])
        pdf.cell(0, 10, title, 0, 1)
        pdf.ln(5)
        
        # Add decorative line
        pdf.set_draw_color(*ReportGenerator.COLORS['accent'])
        pdf.line(10, pdf.get_y(), 50, pdf.get_y())
        pdf.ln(8)

    @staticmethod
    def generate_messages_report(sms_messages: list) -> str:
        """Generate professional SMS messages report"""
        try:
            if not sms_messages:
                raise HTTPException(status_code=400, detail="No message data available for report generation.")

            pdf = ReportGenerator.setup_pdf("SMS Messages Report")
            ReportGenerator.add_header(pdf, "SMS COMMUNICATION REPORT")
            ReportGenerator.add_device_info_section(pdf)
            
            # Summary statistics
            total_messages = len(sms_messages)
            incoming = sum(1 for msg in sms_messages if isinstance(msg, dict) and msg.get("Тип") == "Входящее")
            outgoing = total_messages - incoming
            
            pdf.set_font("DejaVu", "B", 12)
            pdf.set_text_color(*ReportGenerator.COLORS['primary'])
            pdf.cell(0, 8, "Message Statistics", 0, 1)
            pdf.ln(2)
            
            # Stats table
            col_width = 60
            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            pdf.rect(10, pdf.get_y(), 190, 15, 'F')
            
            pdf.set_font("DejaVu", "B", 10)
            pdf.cell(col_width, 8, "Total Messages", 1, 0, 'C', True)
            pdf.cell(col_width, 8, "Incoming", 1, 0, 'C', True)
            pdf.cell(col_width, 8, "Outgoing", 1, 1, 'C', True)
            
            pdf.set_font("DejaVu", "", 10)
            pdf.cell(col_width, 8, str(total_messages), 1, 0, 'C')
            pdf.cell(col_width, 8, str(incoming), 1, 0, 'C')
            pdf.cell(col_width, 8, str(outgoing), 1, 1, 'C')
            pdf.ln(15)
            
            # Messages table
            ReportGenerator.add_chapter_title(pdf, "Message Details")
            
            # Table header
            pdf.set_font("DejaVu", "B", 10)
            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            
            headers = ["Date/Time", "Phone Number", "Type", "Message Preview"]
            widths = [40, 40, 25, 85]
            
            for i, header in enumerate(headers):
                pdf.cell(widths[i], 10, header, 1, 0, 'C', True)
            pdf.ln()
            
            # Table rows
            pdf.set_font("DejaVu", "", 9)
            row_height = 8
            for msg in sms_messages:
                if not isinstance(msg, dict):
                    continue
                
                # Format data
                date = msg.get("Дата", "N/A")
                number = msg.get("Номер", "N/A")
                msg_type = msg.get("Тип", "N/A")
                text = ReportGenerator.remove_emojis(msg.get("Текст", "N/A"))
                preview = (text[:40] + "...") if len(text) > 40 else text
                
                # Color code by message type
                if msg_type == "Входящее":
                    pdf.set_text_color(*ReportGenerator.COLORS['success'])
                else:
                    pdf.set_text_color(*ReportGenerator.COLORS['secondary'])
                
                pdf.cell(widths[0], row_height, date, 1)
                pdf.cell(widths[1], row_height, number, 1)
                pdf.cell(widths[2], row_height, msg_type, 1)
                
                pdf.set_text_color(*ReportGenerator.COLORS['dark'])
                pdf.cell(widths[3], row_height, preview, 1)
                pdf.ln()
            
            # Save report
            report_path = os.path.join(ReportGenerator.REPORTS_DIR, "sms_report.pdf")
            pdf.output(report_path, "F")
            return report_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

    @staticmethod
    def generate_calls_report_from_json(call_logs: list) -> str:
        """Generate professional call log report"""
        try:
            if not call_logs:
                raise HTTPException(status_code=400, detail="No call data available for report generation.")

            pdf = ReportGenerator.setup_pdf("Call Logs Report")
            ReportGenerator.add_header(pdf, "CALL LOGS REPORT")
            ReportGenerator.add_device_info_section(pdf)
            
            # Summary statistics
            total_calls = len(call_logs)
            missed = sum(1 for call in call_logs if isinstance(call, dict) and call.get("Пропущенный") == "Да")
            received = total_calls - missed
            
            pdf.set_font("DejaVu", "B", 12)
            pdf.set_text_color(*ReportGenerator.COLORS['primary'])
            pdf.cell(0, 8, "Call Statistics", 0, 1)
            pdf.ln(2)
            
            # Stats table
            col_width = 60
            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            pdf.rect(10, pdf.get_y(), 190, 15, 'F')
            
            pdf.set_font("DejaVu", "B", 10)
            pdf.cell(col_width, 8, "Total Calls", 1, 0, 'C', True)
            pdf.cell(col_width, 8, "Received", 1, 0, 'C', True)
            pdf.cell(col_width, 8, "Missed", 1, 1, 'C', True)
            
            pdf.set_font("DejaVu", "", 10)
            pdf.cell(col_width, 8, str(total_calls), 1, 0, 'C')
            pdf.cell(col_width, 8, str(received), 1, 0, 'C')
            pdf.cell(col_width, 8, str(missed), 1, 1, 'C')
            pdf.ln(15)
            
            # Call details section
            ReportGenerator.add_chapter_title(pdf, "Call Details")
            
            # Table header
            pdf.set_font("DejaVu", "B", 10)
            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            
            headers = ["Date/Time", "Number", "Type", "Duration", "Status"]
            widths = [40, 40, 30, 30, 50]
            
            for i, header in enumerate(headers):
                pdf.cell(widths[i], 10, header, 1, 0, 'C', True)
            pdf.ln()
            
            # Table rows
            pdf.set_font("DejaVu", "", 9)
            row_height = 8
            for call in call_logs:
                if not isinstance(call, dict):
                    continue
                
                # Format data
                date = call.get("Дата", "N/A")
                number = call.get("Номер", "N/A")
                call_type = call.get("Тип вызова", "N/A")
                duration = call.get("Длительность", "N/A")
                status = "Missed" if call.get("Пропущенный") == "Да" else "Received"
                
                # Color code by status
                if status == "Missed":
                    pdf.set_text_color(*ReportGenerator.COLORS['danger'])
                else:
                    pdf.set_text_color(*ReportGenerator.COLORS['success'])
                
                pdf.cell(widths[0], row_height, date, 1)
                pdf.cell(widths[1], row_height, number, 1)
                
                pdf.set_text_color(*ReportGenerator.COLORS['secondary'])
                pdf.cell(widths[2], row_height, call_type, 1)
                
                pdf.set_text_color(*ReportGenerator.COLORS['dark'])
                pdf.cell(widths[3], row_height, duration, 1)
                
                if status == "Missed":
                    pdf.set_text_color(*ReportGenerator.COLORS['danger'])
                else:
                    pdf.set_text_color(*ReportGenerator.COLORS['success'])
                pdf.cell(widths[4], row_height, status, 1)
                
                pdf.ln()
            
            # Call duration analysis
            pdf.add_page()
            ReportGenerator.add_chapter_title(pdf, "Call Duration Analysis")
            
            # Here you would add visualizations if using a PDF library that supports charts
            # For FPDF, we'll create a simple table-based visualization
            
            # Group calls by duration ranges
            duration_ranges = {
                "0-1 min": 0,
                "1-5 min": 0,
                "5-10 min": 0,
                "10+ min": 0
            }
            
            for call in call_logs:
                if not isinstance(call, dict):
                    continue
                
                duration_str = call.get("Длительность", "0 сек")
                try:
                    duration = int(duration_str.split()[0])
                except:
                    duration = 0
                
                if duration <= 60:
                    duration_ranges["0-1 min"] += 1
                elif duration <= 300:
                    duration_ranges["1-5 min"] += 1
                elif duration <= 600:
                    duration_ranges["5-10 min"] += 1
                else:
                    duration_ranges["10+ min"] += 1
            
            # Create duration distribution table
            pdf.set_font("DejaVu", "B", 10)
            pdf.cell(80, 10, "Duration Range", 1, 0, 'C', True)
            pdf.cell(40, 10, "Count", 1, 0, 'C', True)
            pdf.cell(70, 10, "Percentage", 1, 1, 'C', True)
            
            pdf.set_font("DejaVu", "", 9)
            for range_name, count in duration_ranges.items():
                percentage = (count / total_calls) * 100 if total_calls > 0 else 0
                
                pdf.cell(80, 8, range_name, 1)
                pdf.cell(40, 8, str(count), 1, 0, 'C')
                
                # Visual bar representation
                bar_width = 70 * (percentage / 100)
                pdf.cell(bar_width, 8, "", 0, 0, 'L', True)
                pdf.set_text_color(*ReportGenerator.COLORS['dark'])
                pdf.cell(0, 8, f"{percentage:.1f}%", 1, 1, 'R')
                pdf.set_text_color(*ReportGenerator.COLORS['dark'])
            
            # Save report
            report_path = os.path.join(ReportGenerator.REPORTS_DIR, "calls_report.pdf")
            pdf.output(report_path, "F")
            return report_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

    @staticmethod
    def generate_comprehensive_device_report() -> str:
        """Generate a comprehensive device report with all available information"""
        try:
            pdf = ReportGenerator.setup_pdf("Comprehensive Device Report")
            ReportGenerator.add_header(pdf, "COMPREHENSIVE DEVICE REPORT")
            
            # Device Information
            ReportGenerator.add_device_info_section(pdf)
            
            # System Information
            system_info = ADBService.get_system_info()
            if system_info and "error" not in system_info:
                pdf.add_page()
                ReportGenerator.add_chapter_title(pdf, "System Configuration")
                
                pdf.set_font("DejaVu", "B", 10)
                pdf.cell(0, 8, "Operating System", 0, 1)
                pdf.set_font("DejaVu", "", 9)
                pdf.cell(0, 6, f"Android Version: {system_info.get('android_version', 'N/A')}", 0, 1)
                pdf.cell(0, 6, f"Device Model: {system_info.get('device_name', 'N/A')}", 0, 1)
                pdf.ln(5)
                
                # Battery information
                battery_info = system_info.get('battery', '')
                if battery_info:
                    pdf.set_font("DejaVu", "B", 10)
                    pdf.cell(0, 8, "Battery Status", 0, 1)
                    pdf.set_font("DejaVu", "", 9)
                    
                    level = re.search(r'level: (\d+)', battery_info)
                    status = re.search(r'status: (\d+)', battery_info)
                    health = re.search(r'health: (\d+)', battery_info)
                    temp = re.search(r'temperature: (\d+)', battery_info)
                    
                    status_map = {
                        1: "Unknown", 2: "Charging", 3: "Discharging", 
                        4: "Not charging", 5: "Full"
                    }
                    
                    health_map = {
                        1: "Unknown", 2: "Good", 3: "Overheat", 
                        4: "Dead", 5: "Over voltage", 6: "Unspecified failure", 
                        7: "Cold"
                    }
                    
                    pdf.cell(0, 6, f"Level: {level.group(1) + '%' if level else 'N/A'}", 0, 1)
                    pdf.cell(0, 6, f"Status: {status_map.get(int(status.group(1)), 'Unknown') if status else 'N/A'}", 0, 1)
                    pdf.cell(0, 6, f"Health: {health_map.get(int(health.group(1)), 'Unknown') if health else 'N/A'}", 0, 1)
                    
                    if temp:
                        temp_c = int(temp.group(1)) / 10
                        pdf.cell(0, 6, f"Temperature: {temp_c}°C", 0, 1)
                    
                    pdf.ln(5)
                
                # Storage information
                storage_info = system_info.get('storage', '')
                if storage_info:
                    pdf.set_font("DejaVu", "B", 10)
                    pdf.cell(0, 8, "Storage Information", 0, 1)
                    pdf.set_font("DejaVu", "", 9)
                    
                    storage_match = re.search(r'(\d+%)\s+/\s+(\S+)', storage_info)
                    if storage_match:
                        pdf.cell(0, 6, f"Usage: {storage_match.group(1)} of {storage_match.group(2)}", 0, 1)
                    
                    pdf.ln(5)
                
                # Network information
                pdf.set_font("DejaVu", "B", 10)
                pdf.cell(0, 8, "Network Information", 0, 1)
                pdf.set_font("DejaVu", "", 9)
                
                pdf.cell(0, 6, f"Mobile Operator: {system_info.get('mobile_operator', 'N/A')}", 0, 1)
                
                # GPS information
                gps = system_info.get('gps_coordinates', {})
                if isinstance(gps, dict):
                    pdf.cell(0, 6, 
                            f"Last Known Location: Latitude {gps.get('latitude', 'N/A')}, "
                            f"Longitude {gps.get('longitude', 'N/A')}", 
                            0, 1)
                
                pdf.ln(10)
            
            # Installed Applications
            if system_info and "installed_apps" in system_info:
                pdf.add_page()
                ReportGenerator.add_chapter_title(pdf, "Installed Applications")
                
                apps = system_info["installed_apps"].split('\n')
                pdf.set_font("DejaVu", "", 8)
                
                col_width = 90
                row_height = 6
                apps_per_page = 40
                
                for i, app in enumerate(apps):
                    if i > 0 and i % apps_per_page == 0:
                        pdf.add_page()
                    
                    if i % 2 == 0:
                        pdf.set_fill_color(*ReportGenerator.COLORS['light'])
                        pdf.cell(col_width, row_height, app.replace('package:', '').strip(), 0, 0, 'L', True)
                    else:
                        pdf.cell(col_width, row_height, app.replace('package:', '').strip(), 0, 1, 'L')
            
            # Save report
            report_path = os.path.join(ReportGenerator.REPORTS_DIR, "comprehensive_report.pdf")
            pdf.output(report_path, "F")
            return report_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Comprehensive report generation error: {str(e)}")

    @staticmethod
    def remove_emojis(text):
        """Remove emojis from text"""
        emoji_pattern = re.compile("[\U00010000-\U0010ffff]", flags=re.UNICODE)
        return emoji_pattern.sub("?", text)

    @staticmethod
    def fetch_files_from_path(category: str, directory: str, limit: int) -> list:
        """Download files of specified category from given directory"""
        files = ADBService.list_files(directory).get(category, [])
        
        if not files:
            raise HTTPException(status_code=404, detail=f"No files of category '{category}' found in '{directory}'.")

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
                raise HTTPException(status_code=500, detail=f"Error downloading '{file_path}': {str(e)}")

        if not downloaded_files:
            raise HTTPException(status_code=500, detail=f"Failed to download files of category '{category}' from '{directory}'.")

        return downloaded_files

    @staticmethod
    def generate_pdf(file_paths: list) -> str:
        """Generate PDF with images/documents (enhanced version)"""
        if not file_paths:
            raise HTTPException(status_code=400, detail="No files provided for PDF generation.")

        report_path = os.path.join(ReportGenerator.REPORTS_DIR, f"{file_paths[0].split(os.sep)[-2]}_report.pdf")

        pdf = ReportGenerator.setup_pdf("Media Files Report")
        ReportGenerator.add_header(pdf, "MEDIA FILES REPORT")
        ReportGenerator.add_device_info_section(pdf)
        
        ReportGenerator.add_chapter_title(pdf, "Media Content")
        
        pdf.set_font("DejaVu", "", 10)
        
        for file_path in file_paths:
            # Add new page for each file
            pdf.add_page()
            
            filename = os.path.basename(file_path)
            pdf.set_font("DejaVu", "B", 12)
            pdf.cell(0, 10, f"File: {filename}", 0, 1)
            pdf.ln(5)
            
            try:
                # Try to add image (works for PDFs too)
                pdf.image(file_path, x=10, y=40, w=180)
                
                # Add file metadata
                pdf.set_y(190)
                pdf.set_font("DejaVu", "I", 8)
                pdf.cell(0, 5, f"File path: {file_path}", 0, 1)
                pdf.cell(0, 5, f"Size: {os.path.getsize(file_path) / 1024:.1f} KB", 0, 1)
                pdf.cell(0, 5, f"Modified: {datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S')}", 0, 1)
                
            except RuntimeError as e:
                # Handle non-image files
                pdf.set_font("DejaVu", "", 10)
                pdf.cell(0, 10, "Preview not available for this file type", 0, 1)
                
                # Add file content if it's a text file
                if file_path.endswith('.txt'):
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
                            content = f.read()
                            pdf.multi_cell(0, 6, content[:1000] + ("..." if len(content) > 1000 else ""))
                    except:
                        pass

        pdf.output(report_path)
        return report_path
    
    @staticmethod
    def generate_filtered_file_report(category: str, date_after: str, date_before: Optional[str], limit: int):
        try:
            files = ADBService.filter_files_by_category(category, date_after, date_before, limit)

            if not files:
                raise HTTPException(status_code=404, detail="Файлы не найдены по фильтру")

            ALLOWED_EXTENSIONS = {
                "images": ['.jpg', '.jpeg', '.png', '.bmp', '.gif'],
                "documents": ['.txt', '.log', '.csv', '.json', '.xml',
                              '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
                "videos": ['.mp4', '.mov', '.avi', '.mkv', '.3gp', '.webm']
            }

            allowed_exts = ALLOWED_EXTENSIONS.get(category.lower(), [])

            pdf = ReportGenerator.setup_pdf(title=f"{category.capitalize()} Report")
            ReportGenerator.add_header(pdf, f"{category.upper()} FILES REPORT")
            ReportGenerator.add_device_info_section(pdf)

            pdf.set_font("DejaVu", "B", 12)
            pdf.set_text_color(*ReportGenerator.COLORS['primary'])
            pdf.cell(0, 8, "Файлы", 0, 1)
            pdf.ln(2)

            pdf.set_fill_color(*ReportGenerator.COLORS['light'])
            pdf.rect(10, pdf.get_y(), 190, 10, 'F')
            pdf.set_font("DejaVu", "B", 10)
            pdf.cell(95, 8, "Категория", 1, 0, 'C', True)
            pdf.cell(95, 8, "Количество файлов", 1, 1, 'C', True)

            pdf.set_font("DejaVu", "", 10)
            pdf.cell(95, 8, category.capitalize(), 1, 0, 'C')
            pdf.cell(95, 8, str(len(files)), 1, 1, 'C')
            pdf.ln(10)

            ReportGenerator.add_chapter_title(pdf, "Информация о файлах")

            for idx, file in enumerate(files):
                try:
                    if not isinstance(file, dict) or "path" not in file or "name" not in file or "modified" not in file:
                        raise ValueError(f"Неверная структура file[{idx}]: {file}")

                    local_path = ADBService.download_file(
                        file["path"],
                        output_dir=os.path.join(ReportGenerator.BASE_OUTPUT_DIR, "files")
                    )

                    ext = os.path.splitext(local_path)[1].lower()
                    if ext not in allowed_exts:
                        continue

                    modified_str = (
                        file["modified"].strftime('%Y-%m-%d %H:%M')
                        if hasattr(file["modified"], 'strftime')
                        else str(file["modified"])
                    )

                    name = str(file["name"]).replace("\n", " ").strip()

                    if category.lower() in ["videos", "documents"]:
                        pdf.set_font("DejaVu", "B", 11)
                        pdf.set_text_color(*ReportGenerator.COLORS['primary'])
                        pdf.cell(0, 8, f"{name}", 0, 1)
                        pdf.set_font("DejaVu", "", 10)
                        pdf.set_text_color(*ReportGenerator.COLORS['secondary'])
                        pdf.multi_cell(0, 6, f"Размер: {os.path.getsize(local_path) / 1024:.1f} KB")
                        pdf.multi_cell(0, 6, f"Дата изменения: {modified_str}")
                        pdf.multi_cell(0, 6, f"Путь: {local_path}")
                        pdf.ln(5)
                    else:
                        pdf.add_page()
                        pdf.set_font("DejaVu", "B", 12)
                        pdf.set_text_color(*ReportGenerator.COLORS['primary'])
                        pdf.cell(0, 10, f"{name}", 0, 1)
                        pdf.ln(5)
                        pdf.set_text_color(*ReportGenerator.COLORS['secondary'])
                        pdf.set_font("DejaVu", "", 10)
                        pdf.multi_cell(0, 8, f"Размер: {os.path.getsize(local_path) / 1024:.1f} KB")
                        pdf.multi_cell(0, 8, f"Дата изменения: {modified_str}")
                        pdf.multi_cell(0, 8, f"Путь: {local_path}")
                        pdf.ln(5)

                    if category.lower() == "images":
                        try:
                            pdf.image(local_path, x=30, w=150)
                            pdf.ln(10)
                        except Exception as img_err:
                            pdf.set_text_color(*ReportGenerator.COLORS['danger'])
                            pdf.set_font("DejaVu", "", 10)
                            pdf.multi_cell(0, 8, f"Не удалось вставить изображение: {str(img_err)}")
                            pdf.ln(2)

                    # Удалён блок с чтением и вставкой содержимого документов

                except Exception as e:
                    pdf.set_text_color(*ReportGenerator.COLORS['danger'])
                    pdf.set_font("DejaVu", "", 10)
                    pdf.multi_cell(0, 8, f"[{idx}] Ошибка при обработке: {str(e)}")
                    pdf.ln(2)

            filename = f"{category}_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            output_path = os.path.join(ReportGenerator.REPORTS_DIR, filename)
            pdf.output(output_path)

            return output_path

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Ошибка генерации отчета: {str(e)}")

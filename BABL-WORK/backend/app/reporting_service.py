"""
Reporting Service for PDF generation and report management
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

def generate_analytics_pdf(data: Dict[str, Any], title: str = "Analytics Report") -> BytesIO:
    """Generate a PDF report from analytics data"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1976d2'),
        spaceAfter=30,
        alignment=1  # Center
    )
    elements.append(Paragraph(title, title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Date
    date_style = ParagraphStyle(
        'CustomDate',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        alignment=1
    )
    elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", date_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # Summary section
    if 'summary' in data:
        elements.append(Paragraph("Summary", styles['Heading2']))
        summary_data = [['Metric', 'Value']]
        for key, value in data['summary'].items():
            summary_data.append([key.replace('_', ' ').title(), str(value)])
        
        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Revenue by Pharmacy
    if 'pharmacy_revenue' in data and data['pharmacy_revenue']:
        elements.append(Paragraph("Revenue by Pharmacy", styles['Heading2']))
        pharmacy_data = [['Pharmacy Name', 'Revenue']]
        for item in data['pharmacy_revenue'][:20]:  # Top 20
            name = item.get('pharmacy_name') or item.get('name', 'N/A')
            revenue = item.get('revenue', 0)
            pharmacy_data.append([name, f"${revenue:,.2f}"])
        
        pharmacy_table = Table(pharmacy_data, colWidths=[4*inch, 2*inch])
        pharmacy_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(pharmacy_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Revenue by Doctor
    if 'doctor_revenue' in data and data['doctor_revenue']:
        elements.append(PageBreak())
        elements.append(Paragraph("Revenue by Doctor", styles['Heading2']))
        doctor_data = [['Doctor Name', 'Revenue']]
        for item in data['doctor_revenue'][:20]:  # Top 20
            name = item.get('doctor_name') or item.get('name', 'N/A')
            revenue = item.get('revenue', 0)
            doctor_data.append([name, f"${revenue:,.2f}"])
        
        doctor_table = Table(doctor_data, colWidths=[4*inch, 2*inch])
        doctor_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(doctor_table)
        elements.append(Spacer(1, 0.3*inch))
    
    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer


#!/usr/bin/env python3
"""
Convert markdown resumes to PDF using reportlab
"""
import os
from pathlib import Path
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas
import re

def parse_markdown(md_content):
    """Parse markdown content and return structured data"""
    lines = md_content.split('\n')
    elements = []

    for line in lines:
        line = line.strip()

        if not line:
            elements.append(('space', ''))
            continue

        # H1 headers (# )
        if line.startswith('# '):
            elements.append(('h1', line[2:]))
        # H2 headers (## )
        elif line.startswith('## '):
            elements.append(('h2', line[3:]))
        # H3 headers (### )
        elif line.startswith('### '):
            elements.append(('h3', line[4:]))
        # Bold text (**text**)
        elif '**' in line:
            elements.append(('bold', line))
        # List items (- or *)
        elif line.startswith('- ') or line.startswith('* '):
            elements.append(('list', line[2:]))
        # Horizontal rule (---)
        elif line.startswith('---'):
            elements.append(('hr', ''))
        else:
            elements.append(('normal', line))

    return elements

def clean_markdown_syntax(text):
    """Remove markdown syntax from text"""
    # Remove bold
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    # Remove italic
    text = re.sub(r'\*(.+?)\*', r'<i>\1</i>', text)
    # Remove links but keep text
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)
    return text

def markdown_to_pdf(md_file, pdf_file):
    """Convert markdown file to PDF"""

    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()

    # Parse markdown
    elements = parse_markdown(md_content)

    # Create PDF
    doc = SimpleDocTemplate(
        pdf_file,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Define styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor='#1a1a1a',
        spaceAfter=6,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    h2_style = ParagraphStyle(
        'CustomH2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#2c3e50',
        spaceAfter=6,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )

    h3_style = ParagraphStyle(
        'CustomH3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor='#34495e',
        spaceAfter=4,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )

    bold_style = ParagraphStyle(
        'CustomBold',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#2c3e50',
        fontName='Helvetica-Bold'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#333333',
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )

    list_style = ParagraphStyle(
        'CustomList',
        parent=styles['Normal'],
        fontSize=10,
        textColor='#333333',
        leftIndent=20,
        fontName='Helvetica'
    )

    # Build PDF content
    story = []

    for elem_type, content in elements:
        content = clean_markdown_syntax(content)

        if elem_type == 'h1':
            story.append(Paragraph(content, title_style))
            story.append(Spacer(1, 0.1*inch))
        elif elem_type == 'h2':
            story.append(Spacer(1, 0.15*inch))
            story.append(Paragraph(content, h2_style))
        elif elem_type == 'h3':
            story.append(Paragraph(content, h3_style))
        elif elem_type == 'bold':
            story.append(Paragraph(content, bold_style))
        elif elem_type == 'list':
            story.append(Paragraph('• ' + content, list_style))
        elif elem_type == 'hr':
            story.append(Spacer(1, 0.1*inch))
        elif elem_type == 'space':
            story.append(Spacer(1, 0.05*inch))
        else:
            if content:
                story.append(Paragraph(content, normal_style))

    # Build PDF
    doc.build(story)
    print(f"✓ Created: {pdf_file}")

def main():
    """Convert all markdown resumes to PDF"""
    # Get the script directory
    script_dir = Path(__file__).parent.parent
    resumes_dir = script_dir / 'sample_resumes'

    # Find all markdown files
    md_files = list(resumes_dir.glob('*.md'))

    if not md_files:
        print("No markdown files found in sample_resumes/")
        return

    print(f"Converting {len(md_files)} resume(s) to PDF...")
    print()

    for md_file in md_files:
        pdf_file = md_file.with_suffix('.pdf')
        try:
            markdown_to_pdf(str(md_file), str(pdf_file))
        except Exception as e:
            print(f"✗ Error converting {md_file.name}: {e}")

    print()
    print(f"✓ Conversion complete! PDFs saved in: {resumes_dir}")

if __name__ == '__main__':
    main()

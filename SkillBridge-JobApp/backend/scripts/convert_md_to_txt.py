#!/usr/bin/env python3
"""
Convert markdown resumes to text format for easy PDF conversion
"""
import re
from pathlib import Path

def markdown_to_text(md_content):
    """Convert markdown to clean text"""
    # Remove markdown links but keep text
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', md_content)

    # Remove bold
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)

    # Remove italic
    text = re.sub(r'\*(.+?)\*', r'\1', text)

    # Remove code blocks
    text = re.sub(r'`(.+?)`', r'\1', text)

    # Remove horizontal rules
    text = re.sub(r'^---+$', '=' * 70, text, flags=re.MULTILINE)

    # Clean up headers but keep the text
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)

    return text

def main():
    """Convert all markdown resumes to text"""
    script_dir = Path(__file__).parent.parent
    resumes_dir = script_dir / 'sample_resumes'

    md_files = list(resumes_dir.glob('*.md'))

    if not md_files:
        print("No markdown files found in sample_resumes/")
        return

    print(f"Converting {len(md_files)} resume(s) to text format...")
    print()

    for md_file in md_files:
        txt_file = md_file.with_suffix('.txt')

        with open(md_file, 'r', encoding='utf-8') as f:
            md_content = f.read()

        text_content = markdown_to_text(md_content)

        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(text_content)

        print(f"✓ Created: {txt_file.name}")

    print()
    print(f"✓ Conversion complete!")
    print(f"  Text files saved in: {resumes_dir}")
    print()
    print("You can now:")
    print("  1. Use these .txt files directly with the resume parser")
    print("  2. Convert to PDF using LibreOffice:")
    print("     libreoffice --headless --convert-to pdf sample_resumes/*.txt")

if __name__ == '__main__':
    main()

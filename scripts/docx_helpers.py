import os
import subprocess
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_table_borders(table, color="000000", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:left w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:right w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'  <w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>\n'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def add_image_placeholder(doc, placeholder_text, caption_text):
    # Creates a dedicated box with a dashed border for pasting screenshots
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.3)
    
    # Dashed border
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="dashed" w:sz="12" w:space="0" w:color="64748B"/>\n'
        f'  <w:bottom w:val="dashed" w:sz="12" w:space="0" w:color="64748B"/>\n'
        f'  <w:left w:val="dashed" w:sz="12" w:space="0" w:color="64748B"/>\n'
        f'  <w:right w:val="dashed" w:sz="12" w:space="0" w:color="64748B"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=260, bottom=260, left=200, right=200)
    
    # Paragraph inside
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    
    run_icon = p.add_run("📸  ")
    run_icon.font.name = "Times New Roman"
    run_icon.font.size = Pt(14)
    
    run_text = p.add_run(placeholder_text)
    run_text.font.name = "Times New Roman"
    run_text.font.size = Pt(12)
    run_text.font.bold = True
    run_text.font.color.rgb = RGBColor(15, 23, 42)
    
    p2 = cell.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(2)
    p2.paragraph_format.space_after = Pt(14)
    run_sub = p2.add_run("(Vùng trống chừa sẵn để dán ảnh chụp màn hình minh chứng vào tài liệu)")
    run_sub.font.name = "Times New Roman"
    run_sub.font.size = Pt(10)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(100, 116, 139)
    
    # Caption below box
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(4)
    p_cap.paragraph_format.space_after = Pt(12)
    r_cap = p_cap.add_run(caption_text)
    r_cap.font.name = "Times New Roman"
    r_cap.font.size = Pt(10.5)
    r_cap.font.italic = True
    r_cap.font.color.rgb = RGBColor(71, 85, 105)

def add_prompt_box(doc, title, prompt_content):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.3)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>\n'
        f'  <w:top w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>\n'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>\n'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="0F172A"/>\n'
        f'  <w:right w:val="single" w:sz="6" w:space="0" w:color="0F172A"/>\n'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r_title = p.add_run(f"📋 {title}\n")
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(11.5)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    r_body = p.add_run(prompt_content.strip())
    r_body.font.name = "Courier New"
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = RGBColor(30, 41, 59)

    doc.add_paragraph().paragraph_format.space_after = Pt(4)

print("Helper functions defined.")

import os
import subprocess

docx_file = os.path.abspath('docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.docx')
pdf_file = os.path.abspath('docs/HUONG_DAN_XAY_DUNG_CHATBOT_AI.pdf')

ps_script = f"""
$docPath = "{docx_file.replace('\\', '\\\\')}"
$pdfPath = "{pdf_file.replace('\\', '\\\\')}"
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$doc = $w.Documents.Open($docPath)
$doc.SaveAs([ref]$pdfPath, [ref]17)
$doc.Close()
$w.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($w) | Out-Null
Write-Output "PDF Generated Successfully: $(Test-Path $pdfPath)"
"""

ps_path = 'scripts/convert_pdf.ps1'
with open(ps_path, 'w', encoding='utf-8') as f:
    f.write(ps_script)

res = subprocess.run(['powershell', '-ExecutionPolicy', 'Bypass', '-File', ps_path], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
if os.path.exists(pdf_file):
    print(f"SUCCESS: {pdf_file} (Size: {os.path.getsize(pdf_file)} bytes)")
else:
    print("FAILED: PDF not found.")

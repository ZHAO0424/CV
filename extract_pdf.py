import sys
try:
    import PyPDF2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

def extract_pdf():
    try:
        with open(r'C:\Users\zzrsn\Desktop\CV\Zhao_Zirui_CV.pdf', 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = ''
            for page in reader.pages:
                text += page.extract_text() + '\n'
        with open(r'C:\Users\zzrsn\Desktop\CV\pdf_content.txt', 'w', encoding='utf-8') as out:
            out.write(text)
        print("Success! Extracted text to pdf_content.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_pdf()

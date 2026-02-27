import sys
import io

# ── Force UTF-8 stdout/stderr BEFORE any other output (critical on Windows) ──
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def extract_with_pypdf(pdf_path: str) -> str:
    """Primary extractor using pypdf."""
    from pypdf import PdfReader
    reader = PdfReader(pdf_path)
    pages = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout") or ""
        # pypdf may return str; ensure it is treated as unicode (it already is in pypdf>=3)
        pages.append(text)
    return "\n".join(pages)


def extract_with_pdfminer(pdf_path: str) -> str:
    """Fallback extractor using pdfminer.six – reads the PDF's text layer directly as UTF-8."""
    from pdfminer.high_level import extract_text as pm_extract
    # codec='utf-8' ensures pdfminer decodes CMap / ToUnicode tables correctly
    return pm_extract(pdf_path, codec='utf-8')


def clean_text(text: str) -> str:
    """
    Normalise common Unicode artefacts produced when a PDF's encoding is
    mis-detected as Latin-1 by the caller.

    All characters below are Latin-1 multi-byte sequences that appear when
    UTF-8 bytes are decoded as ISO-8859-1.  We re-encode as Latin-1 then
    decode as UTF-8 to recover the original codepoints.
    """
    try:
        # If the text was already mis-decoded we can round-trip it back
        recovered = text.encode('latin-1').decode('utf-8')
        return recovered
    except (UnicodeEncodeError, UnicodeDecodeError):
        # Text was already correctly decoded — return as-is
        return text


def extract_text(pdf_path: str) -> str:
    text = ""

    # 1. Try pypdf first (faster, usually sufficient)
    try:
        text = extract_with_pypdf(pdf_path)
    except Exception as e:
        print(f"[pypdf] extraction warning: {e}", file=sys.stderr)

    # 2. If pypdf returned garbage or nothing, fall back to pdfminer
    if not text or not text.strip():
        try:
            text = extract_with_pdfminer(pdf_path)
        except Exception as e:
            print(f"[pdfminer] extraction warning: {e}", file=sys.stderr)

    if not text or not text.strip():
        print("ERROR: No text could be extracted from the PDF.", file=sys.stderr)
        sys.exit(1)

    # 3. If the extracted string still contains Latin-1 artefacts, fix them
    text = clean_text(text)

    return text


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    extracted_text = extract_text(pdf_path)
    # sys.stdout is already UTF-8 — print writes unicode correctly
    print(extracted_text)

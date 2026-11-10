#!/usr/bin/env python3
"""Extract text from the Vim book PDFs/EPUBs into books-text/*.txt (not committed).

Known limits (keep in mind before re-extracting):
  * Some Leanpub PDFs store inter-word spaces only as glyph *positions*, not as
    space characters in the text stream. pypdf cannot reconstruct those words;
    `pdf_text()` therefore prefers pypdfium2 (PDFium), which reads glyph
    positions and recovers the spaces. If pypdfium2 is missing it falls back to
    pypdf, and the affected books (gourmet-vim, use-vim-like-a-pro,
    vim-reference-guide) come out with run-on words.
  * `scrub()` removes the per-page buyer watermark (name/email + transaction id)
    that PDF storefronts stamp onto copies, so personal data never lands in the
    text files.
"""
import os, re, sys, zipfile
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "books-text"
OUT.mkdir(exist_ok=True)
BOOKS = ROOT / "books"          # drop the PDFs/EPUBs here
BOOKS.mkdir(exist_ok=True)

ATTACH = Path("/home/jung/.dsh/attachments/v1/files")
FILES = {
    "vim-reference-guide": "68/68e6f8baeccfe0adc74784e1db122a8eed4a007bc8dd61f7e6230585c6a68efc/Vim Reference Guide - Sundeep Agarwal.pdf",
    "5-years-of-vim": "ba/ba7db1ca02cfb63469f35cab013a0e7514305b885875a56ba4e021d58a3f2d08/5 Years Of Vim _A collection of blog posts from 2017 to 2021_ - Claudio Ribeiro.pdf",
    "vim-101-hacks": "ea/ead290fb213be03e25300033126ae2cea58b1956d9f3780a7a11d6d83fa87675/Vim 101 Hacks_ Practical Examples for Becoming Fast and Productive in Vim Editor - Ramesh Natarajan.pdf",
    "use-vim-like-a-pro": "2f/2f86be179952290cd5faa1613dd7205c721e228b87b26e3bcdb66f0e265b1a45/Use Vim Like A Pro - Tim Ottinger.pdf",
    "pro-vim": "68/68beab4577356ea4869722bd2e8c1e4dde6382e6069e723393dca16d983bd7c1/Pro Vim_ Achieve Greater Understanding and Practical Workflows Using This Essential Terminal Application - Mark McDonnell.epub",
    "learning-vi-vim": "a5/a564169a2009f03e35fb2c0e03114f3fa820d0425a3ae3eb21d039947536ac69/Learning the vi and Vim Editors_ Power and Agility Beyond Just Text Editing - Arnold Robbins.epub",
    "gourmet-vim": "6e/6ed0ee44c78c05852668d67773adbbb13c16fd37bb7270fe714b0396beefafd4/Gourmet Vim_ A Cookbook With 200+ Practical Recipes - Igor Irianto.pdf",
    "practical-vim": "1e/1e81a24e1090151cce4d86a7c0edd048b47e05b621a1690843f6e0afb870521e/Practical Vim_ Edit Text at the Speed of Thought - Drew Neil (1).epub",
    "modern-vim": "df/dfc32feca4bb229ef8348e340374671d4f603d087a1cfc63af32c3c2d8b08589/Modern Vim_ Craft Your Development Environment with Vim 8 and Neovim - Drew Neil.epub",
    "neovim-for-beginners": "b0/b048fcf3bfd524905df2068673c0db45e0ed86a794f82699acbe6d9e11ee8445/Neovim for Beginners_ A Complete Guide From Installation to a Fully-Fledged IDE - Alvaro Leal.epub",
}

def pdfium_text(path):
    import pypdfium2 as pdfium
    pdf = pdfium.PdfDocument(str(path))
    out = []
    for page in pdf:
        try:
            tp = page.get_textpage()
            out.append(tp.get_text_bounded() or "")
        except Exception as e:
            out.append(f"\n[extract error: {e}]\n")
    return "\n\f\n".join(out)

def pypdf_text(path):
    from pypdf import PdfReader
    r = PdfReader(str(path))
    out = []
    for i, page in enumerate(r.pages):
        try:
            out.append(page.extract_text() or "")
        except Exception as e:
            out.append(f"\n[extract error p{i}: {e}]\n")
    return "\n\f\n".join(out)

def pdf_text(path):
    # PDFium reconstructs inter-word spaces from glyph positions, which pypdf
    # cannot do for some Leanpub PDFs. Fall back to pypdf if PDFium is absent.
    try:
        import pypdfium2  # noqa: F401
        return pdfium_text(path)
    except ImportError:
        return pypdf_text(path)

class Stripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.buf, self.skip = [], 0
        self.block = {"p","div","h1","h2","h3","h4","h5","h6","li","br","tr","pre","blockquote","section","article"}
    def handle_starttag(self, tag, attrs):
        if tag in ("script","style"): self.skip += 1
        if tag in self.block: self.buf.append("\n")
    def handle_endtag(self, tag):
        if tag in ("script","style") and self.skip: self.skip -= 1
        if tag in self.block: self.buf.append("\n")
    def handle_data(self, d):
        if not self.skip: self.buf.append(d)

def epub_text(path):
    out = []
    with zipfile.ZipFile(path) as z:
        names = [n for n in z.namelist() if re.search(r"\.(x?html|htm)$", n, re.I)]
        # spine order if possible
        order = []
        try:
            opf = [n for n in z.namelist() if n.endswith(".opf")][0]
            opfdir = os.path.dirname(opf)
            manifest = dict(re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', z.read(opf).decode("utf8","ignore")))
            spine = re.findall(r'<itemref[^>]*idref="([^"]+)"', z.read(opf).decode("utf8","ignore"))
            order = [os.path.normpath(os.path.join(opfdir, manifest[i])) for i in spine if i in manifest]
        except Exception:
            pass
        if not order:
            order = sorted(names)
        for n in order:
            n2 = n if n in z.namelist() else n.replace("\\","/")
            if n2 not in z.namelist(): continue
            s = Stripper(); s.feed(z.read(n2).decode("utf8","ignore"))
            t = "".join(s.buf)
            t = re.sub(r"[ \t]+", " ", t)
            t = re.sub(r"\n\s*\n+", "\n\n", t)
            if t.strip(): out.append(t)
    return "\n\n".join(out)

def scrub(t):
    """Remove personal data that PDF storefronts watermark onto pages."""
    # buyer watermark (name + email) and transaction id, repeated per page
    t = re.sub(r"(?im)^\s*Buyer:\s*[^\n]*\n?", "", t)
    t = re.sub(r"(?im)^\s*Transaction\s+ID:\s*[^\n]*\n?", "", t)
    # any line that is nothing but an email address
    t = re.sub(r"(?im)^\s*[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\s*\n?", "", t)
    return t

def clean(t):
    t = scrub(t)
    t = t.replace("\u00ad", "")
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def discover():
    """Prefer ./books/*.{pdf,epub}; fall back to the original attachment map."""
    found = sorted([p for p in BOOKS.iterdir() if p.suffix.lower() in (".pdf", ".epub")]) if BOOKS.exists() else []
    if found:
        return [(p.stem.lower().replace(" ", "-")[:48], str(p)) for p in found]
    return list(FILES.items())

for slug, rel in discover():
    src = Path(rel) if str(rel).startswith("/") else (ATTACH / rel)
    dst = OUT / f"{slug}.txt"
    if dst.exists() and dst.stat().st_size > 1000 and "--force" not in sys.argv:
        print(f"skip {slug}")
        continue
    try:
        t = epub_text(src) if src.suffix == ".epub" else pdf_text(src)
        dst.write_text(clean(t), encoding="utf8")
        print(f"{slug}: {len(t)//1000}k chars, {t.count(chr(10))//40} ~pages")
    except Exception as e:
        print(f"FAIL {slug}: {e}")

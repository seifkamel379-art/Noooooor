#!/usr/bin/env python3
"""
Extract إعراب (grammatical analysis) from إعراب القرآن الكريم PDF
Author: الدكتور محمد القاضي
Publisher: دار النشر والتوزيع - القاهرة
Edition: الطبعة الأولى 2000م
ISBN: 977-255-280-9
"""

import fitz
import subprocess
import json
import os
import re
import sys
import time
from pathlib import Path
from multiprocessing import Pool, cpu_count

PDF_PATH = "attached_assets/إعراب_القرآن_الكريم_1776423152342.pdf"
OUTPUT_DIR = "artifacts/noor/public/data/irab"
LOG_FILE = "/tmp/irab_extract.log"

METADATA = {
    "title": "إعراب القرآن الكريم",
    "author": "الدكتور محمد القاضي",
    "publisher": "دار النشر والتوزيع - القاهرة",
    "edition": "الطبعة الأولى",
    "year": "2000م",
    "isbn": "977-255-280-9",
    "depositNumber": "قا ١٠م",
    "copyright": "جميع الحقوق محفوظة للناشر والمؤلف",
    "note": "هذه البيانات مستخرجة من الكتاب لأغراض تعليمية غير تجارية. يُرجى الرجوع إلى المصدر الأصلي."
}

SURAH_NAMES = [
    "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة",
    "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
    "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
    "النحل", "الإسراء", "الكهف", "مريم", "طه",
    "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
    "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
    "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر",
    "يس", "الصافات", "ص", "الزمر", "غافر",
    "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
    "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
    "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
    "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
    "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق",
    "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
    "نوح", "الجن", "المزمل", "المدثر", "القيامة",
    "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
    "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج",
    "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
    "الشمس", "الليل", "الضحى", "الشرح", "التين",
    "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
    "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل",
    "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
    "المسد", "الإخلاص", "الفلق", "الناس"
]

SURAH_NAME_TO_NUM = {name: i+1 for i, name in enumerate(SURAH_NAMES)}


def log(msg):
    timestamp = time.strftime("%H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def ocr_page_worker(args):
    """Worker function for multiprocessing: OCR a single page."""
    page_idx, pdf_path = args
    try:
        doc = fitz.open(pdf_path)
        page = doc[page_idx]
        mat = fitz.Matrix(2.0, 2.0)
        pix = page.get_pixmap(matrix=mat)
        img_path = f"/tmp/irab_p_{page_idx}.png"
        pix.save(img_path)
        doc.close()

        result = subprocess.run(
            ["tesseract", img_path, "stdout", "-l", "ara",
             "--oem", "1", "--psm", "6"],
            capture_output=True, text=True, timeout=90
        )
        os.remove(img_path)
        return page_idx, result.stdout.strip()
    except Exception as e:
        return page_idx, ""


def clean_text(text):
    """Remove OCR noise while keeping Arabic and relevant punctuation."""
    # Keep Arabic chars, spaces, parens, colons, Arabic punctuation
    cleaned = re.sub(
        r'[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF'
        r'\s\(\)\[\]0-9٠-٩،؛:.،»«\-]',
        ' ', text
    )
    cleaned = re.sub(r' {2,}', ' ', cleaned)
    return cleaned.strip()


def detect_surah_name(text):
    """Return surah name if found in text."""
    for name in SURAH_NAMES:
        pattern = rf'سورة\s+{re.escape(name)}'
        if re.search(pattern, text):
            return name
    return None


def split_by_ayahs(text):
    """Split combined surah text into dict {ayah_num: irab_text}."""
    # Match Arabic-Indic or Western digits in parens
    pattern = r'[\(\(]([٠-٩0-9]{1,3})[\)\)]'
    parts = re.split(pattern, text)
    ayahs = {}
    i = 1
    while i < len(parts) - 1:
        raw_num = parts[i]
        # Convert Arabic-Indic numerals
        western = raw_num.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
        try:
            ayah_num = int(western)
            if 1 <= ayah_num <= 300:
                ayahs[str(ayah_num)] = clean_text(parts[i + 1])
        except ValueError:
            pass
        i += 2
    return ayahs


def save_surah_json(surah_num, surah_name, pages_texts):
    """Merge page texts and save to JSON."""
    combined = "\n".join(p for p in pages_texts if p)
    ayahs = split_by_ayahs(combined)

    data = {
        "surah": {"number": surah_num, "name": surah_name},
        "source": METADATA,
        "irab": ayahs,
        "rawText": combined
    }

    path = f"{OUTPUT_DIR}/surah_{surah_num:03d}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    log(f"Saved surah {surah_num} ({surah_name}): {len(ayahs)} ayahs → {path}")
    return path


def build_index():
    index = {"generatedAt": time.strftime("%Y-%m-%d"), "metadata": METADATA, "surahs": []}
    for i, name in enumerate(SURAH_NAMES, 1):
        fp = f"{OUTPUT_DIR}/surah_{i:03d}.json"
        if os.path.exists(fp):
            with open(fp, encoding="utf-8") as f:
                d = json.load(f)
            index["surahs"].append({
                "number": i,
                "name": name,
                "file": f"surah_{i:03d}.json",
                "ayahCount": len(d.get("irab", {}))
            })
    with open(f"{OUTPUT_DIR}/index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    log(f"Index saved: {len(index['surahs'])} surahs")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save metadata immediately
    with open(f"{OUTPUT_DIR}/metadata.json", "w", encoding="utf-8") as f:
        json.dump(METADATA, f, ensure_ascii=False, indent=2)
    log("Saved metadata.json")

    start_page = int(sys.argv[1]) if len(sys.argv) > 1 else 14
    end_page_arg = int(sys.argv[2]) if len(sys.argv) > 2 else None

    doc = fitz.open(PDF_PATH)
    total = len(doc)
    doc.close()

    end_page = end_page_arg if end_page_arg else total
    log(f"Processing pages {start_page + 1}–{end_page} of {total}")

    workers = max(1, min(4, cpu_count()))
    log(f"Using {workers} parallel workers")

    # Process in batches
    BATCH = workers * 2
    page_texts = {}  # page_idx -> text

    current_surah_name = None
    current_surah_num = None
    current_pages = []

    for batch_start in range(start_page, end_page, BATCH):
        batch_end = min(batch_start + BATCH, end_page)
        batch = [(i, PDF_PATH) for i in range(batch_start, batch_end)]

        with Pool(processes=workers) as pool:
            results = pool.map(ocr_page_worker, batch)

        for page_idx, text in sorted(results, key=lambda x: x[0]):
            page_num = page_idx + 1
            log(f"Page {page_num}: {len(text)} chars")

            if not text or len(text) < 30:
                continue

            detected = detect_surah_name(text)
            if detected and detected != current_surah_name:
                # Save previous surah
                if current_surah_name and current_pages:
                    save_surah_json(current_surah_num, current_surah_name, current_pages)

                current_surah_name = detected
                current_surah_num = SURAH_NAME_TO_NUM.get(detected, 0)
                current_pages = []
                log(f"  ↳ New surah: {current_surah_num} {current_surah_name}")

            if current_surah_name:
                current_pages.append(text)

        # Save current surah periodically
        if current_surah_name and current_pages:
            save_surah_json(current_surah_num, current_surah_name, current_pages)

    # Final save
    if current_surah_name and current_pages:
        save_surah_json(current_surah_num, current_surah_name, current_pages)

    build_index()
    log("=== EXTRACTION COMPLETE ===")


if __name__ == "__main__":
    main()

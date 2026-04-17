#!/usr/bin/env python3
"""
Simple sequential OCR extraction of إعراب القرآن الكريم
Run with: python3 scripts/extract-irab-simple.py [start_page] [end_page]
"""
import sys, os, re, json, time, subprocess
os.environ["PYTHONUNBUFFERED"] = "1"

import fitz

PDF_PATH = "attached_assets/إعراب_القرآن_الكريم_1776423152342.pdf"
OUTPUT_DIR = "artifacts/noor/public/data/irab"
os.makedirs(OUTPUT_DIR, exist_ok=True)

METADATA = {
    "title": "إعراب القرآن الكريم",
    "author": "الدكتور محمد القاضي",
    "publisher": "دار النشر والتوزيع - القاهرة",
    "edition": "الطبعة الأولى",
    "year": "2000م",
    "isbn": "977-255-280-9",
    "depositNumber": "قا ١٠م",
    "copyright": "جميع الحقوق محفوظة للناشر والمؤلف",
    "note": "هذه البيانات مستخرجة من الكتاب لأغراض تعليمية غير تجارية."
}

SURAH_NAMES = [
    "الفاتحة","البقرة","آل عمران","النساء","المائدة",
    "الأنعام","الأعراف","الأنفال","التوبة","يونس",
    "هود","يوسف","الرعد","إبراهيم","الحجر",
    "النحل","الإسراء","الكهف","مريم","طه",
    "الأنبياء","الحج","المؤمنون","النور","الفرقان",
    "الشعراء","النمل","القصص","العنكبوت","الروم",
    "لقمان","السجدة","الأحزاب","سبأ","فاطر",
    "يس","الصافات","ص","الزمر","غافر",
    "فصلت","الشورى","الزخرف","الدخان","الجاثية",
    "الأحقاف","محمد","الفتح","الحجرات","ق",
    "الذاريات","الطور","النجم","القمر","الرحمن",
    "الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
    "الصف","الجمعة","المنافقون","التغابن","الطلاق",
    "التحريم","الملك","القلم","الحاقة","المعارج",
    "نوح","الجن","المزمل","المدثر","القيامة",
    "الإنسان","المرسلات","النبأ","النازعات","عبس",
    "التكوير","الانفطار","المطففين","الانشقاق","البروج",
    "الطارق","الأعلى","الغاشية","الفجر","البلد",
    "الشمس","الليل","الضحى","الشرح","التين",
    "العلق","القدر","البينة","الزلزلة","العاديات",
    "القارعة","التكاثر","العصر","الهمزة","الفيل",
    "قريش","الماعون","الكوثر","الكافرون","النصر",
    "المسد","الإخلاص","الفلق","الناس"
]
SURAH_NUM = {n: i+1 for i, n in enumerate(SURAH_NAMES)}

def ocr(page_idx, doc):
    page = doc[page_idx]
    mat = fitz.Matrix(2.0, 2.0)
    pix = page.get_pixmap(matrix=mat)
    img = f"/tmp/irab_{page_idx}.png"
    pix.save(img)
    r = subprocess.run(["tesseract", img, "stdout", "-l", "ara", "--oem", "1", "--psm", "6"],
                       capture_output=True, text=True, timeout=60)
    try: os.remove(img)
    except: pass
    return r.stdout.strip()

def clean(text):
    t = re.sub(r'[^\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s\(\)0-9٠-٩،؛:.]', ' ', text)
    return re.sub(r' {2,}', ' ', t).strip()

def find_surah(text):
    for name in SURAH_NAMES:
        if re.search(rf'سورة\s+{re.escape(name)}', text):
            return name
    return None

def split_ayahs(text):
    parts = re.split(r'[\(\(]([٠-٩0-9]{1,3})[\)\)]', text)
    out = {}
    for i in range(1, len(parts)-1, 2):
        num_s = parts[i].translate(str.maketrans('٠١٢٣٤٥٦٧٨٩','0123456789'))
        try:
            n = int(num_s)
            if 1 <= n <= 300:
                out[str(n)] = clean(parts[i+1])
        except: pass
    return out

def save(num, name, pages):
    combined = "\n".join(p for p in pages if p)
    data = {"surah": {"number": num, "name": name}, "source": METADATA,
            "irab": split_ayahs(combined), "rawText": combined}
    path = f"{OUTPUT_DIR}/surah_{num:03d}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{time.strftime('%H:%M:%S')}] Saved surah {num} {name}: {len(data['irab'])} ayahs", flush=True)

start = int(sys.argv[1]) if len(sys.argv) > 1 else 14
end   = int(sys.argv[2]) if len(sys.argv) > 2 else None

with open(f"{OUTPUT_DIR}/metadata.json", "w", encoding="utf-8") as f:
    json.dump(METADATA, f, ensure_ascii=False, indent=2)

doc = fitz.open(PDF_PATH)
total = len(doc)
end = end or total
print(f"Pages {start+1}-{end} of {total}", flush=True)

cur_name, cur_num, cur_pages = None, None, []

for i in range(start, end):
    print(f"Page {i+1}...", end=" ", flush=True)
    t = ocr(i, doc)
    print(f"chars={len(t)}", flush=True)
    if len(t) < 30: continue
    
    found = find_surah(t)
    if found and found != cur_name:
        if cur_name and cur_pages:
            save(cur_num, cur_name, cur_pages)
        cur_name, cur_num, cur_pages = found, SURAH_NUM[found], []
        print(f"  → Surah {cur_num}: {cur_name}", flush=True)
    
    if cur_name:
        cur_pages.append(t)

if cur_name and cur_pages:
    save(cur_num, cur_name, cur_pages)

# Build index
index = {"metadata": METADATA, "generatedAt": time.strftime("%Y-%m-%d"), "surahs": []}
for i, name in enumerate(SURAH_NAMES, 1):
    fp = f"{OUTPUT_DIR}/surah_{i:03d}.json"
    if os.path.exists(fp):
        with open(fp, encoding="utf-8") as f:
            d = json.load(f)
        index["surahs"].append({"number": i, "name": name, "file": f"surah_{i:03d}.json",
                                  "ayahCount": len(d.get("irab", {}))})
with open(f"{OUTPUT_DIR}/index.json", "w", encoding="utf-8") as f:
    json.dump(index, f, ensure_ascii=False, indent=2)

print("Done!", flush=True)

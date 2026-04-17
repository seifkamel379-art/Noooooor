#!/usr/bin/env python3
"""
Convert quran-morphology.txt to per-surah JSON files.
Source: github.com/mustafa0x/quran-morphology (Quranic Arabic Corpus v0.4)
License: GNU GPL
"""
import json, re, os, sys, collections
from pathlib import Path

MORPHOLOGY_FILE = "/tmp/quran-morphology.txt"
TERMS_FILE      = "/tmp/morphology-terms-ar.json"
OUTPUT_DIR      = "artifacts/noor/public/data/irab"

SOURCE = {
    "title": "Quranic Arabic Corpus - التحليل الصرفي للقرآن الكريم",
    "originalSource": "corpus.quran.com",
    "githubRepo": "github.com/mustafa0x/quran-morphology",
    "license": "GNU GPL v3",
    "version": "0.4",
    "description": "تحليل صرفي ونحوي لكل كلمة في القرآن الكريم مبني على مشروع المدوّنة القرآنية العربية",
    "note": "البيانات مرخّصة بموجب رخصة GNU GPL. المصدر: corpus.quran.com"
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

# ─── Arabic labels ────────────────────────────────────────────────────────────
TYPE_AR = {
    "N": "اسم", "V": "فعل", "P": "حرف",
    "ADJ": "صفة", "T": "ظرف زمان", "LOC": "ظرف مكان",
}

FEATURE_AR = {
    # POS subtypes
    "PN":        "علم",
    "PRON":      "ضمير",
    "DEM":       "اسم إشارة",
    "REL":       "اسم موصول",
    "ACT_PCPL":  "اسم فاعل",
    "PASS_PCPL": "اسم مفعول",
    "VN":        "مصدر",
    "NV":        "اسم فعل",
    "COND":      "شرطية",
    "INTG":      "استفهامية",
    # Particle subtypes
    "P":     "حرف جر",
    "CONJ":  "حرف عطف",
    "SUB":   "حرف مصدري",
    "ACC":   "حرف نصب",
    "NEG":   "حرف نفي",
    "DET":   "أداة التعريف",
    "EMPH":  "لام التوكيد",
    "IMPV":  "لام الأمر",
    "PRP":   "لام التعليل",
    "AMD":   "حرف استدراك",
    "ANS":   "حرف جواب",
    "AVR":   "حرف ردع",
    "CAUS":  "حرف سببية",
    "CERT":  "حرف تحقيق",
    "CIRC":  "حرف حال",
    "COM":   "واو المعية",
    "EQ":    "حرف تسوية",
    "EXH":   "حرف تحضيض",
    "EXL":   "حرف تفصيل",
    "EXP":   "أداة استثناء",
    "FUT":   "حرف استقبال",
    "INC":   "حرف ابتداء",
    "INT":   "حرف تفسير",
    "PREV":  "حرف كاف",
    "PRO":   "حرف نهي",
    "REM":   "حرف استئناف",
    "RES":   "أداة حصر",
    "RET":   "حرف إضراب",
    "RSLT":  "حرف واقع في جواب الشرط",
    "SUP":   "حرف زائد",
    "SUR":   "حرف فجاءة",
    "VOC":   "حرف نداء",
    "ATT":   "حرف تنبيه",
    "DIST":  "لام البعد",
    "ADDR":  "حرف خطاب",
    "INL":   "حروف مقطعة",
    # Case / mood
    "NOM":  "مرفوع",
    "GEN":  "مجرور",
    # ACC already mapped to حرف نصب, but for case ACC we use منصوب
    # Handle contextually below
    # Verb tense
    "PERF": "فعل ماضٍ",
    "IMPF": "فعل مضارع",
    "IMPV": "فعل أمر",   # overrides IMPV particle above when type=V
    "PASS": "مبني للمجهول",
    # Mood
    "IND":  "مرفوع",
    "SUBJ": "منصوب",
    "JUS":  "مجزوم",
    "MOOD": None,  # handled with sub-value
    # Gender / number
    "M":   "مذكر",
    "F":   "مؤنث",
    "MS":  "مفرد مذكر",
    "FS":  "مفرد مؤنث",
    "MD":  "مثنى مذكر",
    "FD":  "مثنى مؤنث",
    "MP":  "جمع مذكر",
    "FP":  "جمع مؤنث",
    "D":   "مثنى",
    # Person
    "1S":  "متكلم مفرد",
    "1P":  "متكلم جمع",
    "1D":  "متكلم مثنى",
    "2MS": "مخاطب مذكر مفرد",
    "2FS": "مخاطبة مؤنثة مفردة",
    "2MD": "مخاطب مذكر مثنى",
    "2FD": "مخاطبة مؤنثة مثنى",
    "2MP": "مخاطب مذكر جمع",
    "2FP": "مخاطبة مؤنثة جمع",
    "3MS": "غائب مذكر مفرد",
    "3FS": "غائبة مؤنثة مفردة",
    "3MD": "غائب مذكر مثنى",
    "3FD": "غائبة مؤنثة مثنى",
    "3MP": "غائب مذكر جمع",
    "3FP": "غائبة مؤنثة جمع",
    # Verb form
    "VF:1": "مجرد (فعل أول)",
    "VF:2": "مزيد بحرف (فعل ثانٍ)",
    "VF:3": "مزيد بحرفين (فعل ثالث)",
    "VF:4": "رباعي (فعل رابع)",
    "VF:5": "مزيد خماسي (فعل خامس)",
    "VF:6": "مزيد سداسي (فعل سادس)",
    "VF:7": "انفعال (فعل سابع)",
    "VF:8": "افتعال (فعل ثامن)",
    "VF:9": "افعلال (فعل تاسع)",
    "VF:10": "استفعال (فعل عاشر)",
    "VF:11": "افعيلال (فعل حادي عشر)",
    "VF:12": "تفاعل (فعل ثاني عشر)",
    # Pronoun types
    "SEP":  "ضمير منفصل",
    "CONN": "ضمير متصل",
    "EMBD": "ضمير مستتر",
    # Misc
    "INDEF": "نكرة",
    "PREF":  "بادئة",
    "SUFF":  "لاحقة",
    "FAM":   "عائلة",
    "ADJ":   "نعت",
}

VERB_TENSE = {"PERF": "ماضٍ", "IMPF": "مضارع", "IMPV": "أمر"}
VERB_VOICE = {"PASS": " مبني للمجهول", "ACT": ""}

PERSON_LABELS = {
    "1S": "متكلم مفرد", "1P": "متكلم جمع", "1D": "متكلم مثنى",
    "2MS": "مخاطب مذكر مفرد", "2FS": "مخاطبة مؤنثة مفردة",
    "2MD": "مخاطب مثنى", "2FD": "مخاطبة مثنى",
    "2MP": "مخاطب مذكر جمع", "2FP": "مخاطبة مؤنثة جمع",
    "3MS": "غائب مذكر مفرد", "3FS": "غائبة مؤنثة مفردة",
    "3MD": "غائب مثنى", "3FD": "غائبة مثنى",
    "3MP": "غائب مذكر جمع", "3FP": "غائبة مؤنثة جمع",
}

CASE_LABELS  = {"NOM": "مرفوع", "ACC": "منصوب", "GEN": "مجرور"}
MOOD_LABELS  = {"IND": "مرفوع", "SUBJ": "منصوب", "JUS": "مجزوم", "JUSS": "مجزوم", "ENG": "مؤكد"}
GENDER_LABELS= {"M": "مذكر", "F": "مؤنث", "MS": "مفرد مذكر", "FS": "مفرد مؤنث",
                "MP": "جمع مذكر", "FP": "جمع مؤنث", "MD": "مثنى مذكر", "FD": "مثنى مؤنث",
                "D":  "مثنى"}


def build_arabic_label(seg_type: str, features: list[str]) -> str:
    """Build a human-readable Arabic إعراب label for one morpheme."""
    feat_set = set(features)
    parts = []

    # ── Prefix / Suffix markers ───────────────────────────────────────────────
    is_pref = "PREF" in feat_set
    is_suff = "SUFF" in feat_set

    # ── Detect base type ──────────────────────────────────────────────────────
    if seg_type == "V":
        tense = next((VERB_TENSE[t] for t in ("PERF","IMPF","IMPV") if t in feat_set), "فعل")
        voice = " مبني للمجهول" if "PASS" in feat_set else ""
        parts.append(f"فعل {tense}{voice}")

        mood_val = next((v.split(":")[1] for v in features if v.startswith("MOOD:")), None)
        if mood_val and mood_val in MOOD_LABELS:
            parts.append(MOOD_LABELS[mood_val])

        person = next((PERSON_LABELS[p] for p in PERSON_LABELS if p in feat_set), None)
        if person:
            parts.append(person)

        vf = next((v for v in features if v.startswith("VF:")), None)
        if vf and vf in FEATURE_AR:
            parts.append(FEATURE_AR[vf])

    elif seg_type == "N":
        # Determine noun subtype
        if "PN" in feat_set:       parts.append("اسم علم")
        elif "DEM" in feat_set:    parts.append("اسم إشارة")
        elif "REL" in feat_set:    parts.append("اسم موصول")
        elif "PRON" in feat_set:
            if is_suff:            parts.append("ضمير متصل")
            else:                  parts.append("ضمير")
        elif "ACT_PCPL" in feat_set: parts.append("اسم فاعل")
        elif "PASS_PCPL" in feat_set: parts.append("اسم مفعول")
        elif "VN" in feat_set:     parts.append("مصدر")
        elif "NV" in feat_set:     parts.append("اسم فعل")
        elif "T" in feat_set:      parts.append("ظرف زمان")
        elif "LOC" in feat_set:    parts.append("ظرف مكان")
        elif "COND" in feat_set:   parts.append("اسم شرط")
        elif "INTG" in feat_set:   parts.append("اسم استفهام")
        else:                      parts.append("اسم")

        # Gender / number
        gn = next((GENDER_LABELS[g] for g in ("MS","FS","MP","FP","MD","FD","M","F","D") if g in feat_set), None)
        if gn:
            parts.append(gn)

        # Definiteness
        if "INDEF" in feat_set:
            parts.append("نكرة")

        # Case
        case = next((CASE_LABELS[c] for c in ("NOM","ACC","GEN") if c in feat_set), None)
        if case:
            parts.append(case)

    elif seg_type == "P":
        if is_pref:
            # Identify prefix type
            if "DET" in feat_set:       parts.append("أداة التعريف (ال)")
            elif "CONJ" in feat_set:    parts.append("واو العطف")
            elif "P" in feat_set:
                lem = next((v.split(":")[1] for v in features if v.startswith("LEM:")), "")
                parts.append(f"حرف جر ({lem})")
            elif "NEG" in feat_set:     parts.append("لا النافية (بادئة)")
            elif "EMPH" in feat_set:    parts.append("لام التوكيد (بادئة)")
            elif "IMPV" in feat_set:    parts.append("لام الأمر (بادئة)")
            elif "PRP" in feat_set:     parts.append("لام التعليل (بادئة)")
            elif "FUT" in feat_set:     parts.append("سوف / السين (بادئة)")
            elif "REM" in feat_set:     parts.append("واو الاستئناف (بادئة)")
            elif "SUB" in feat_set:     parts.append("حرف مصدري (بادئة)")
            elif "RSLT" in feat_set:    parts.append("فاء جواب الشرط (بادئة)")
            elif "ATT" in feat_set:     parts.append("حرف تنبيه (بادئة)")
            elif "VOC" in feat_set:     parts.append("يا النداء (بادئة)")
            elif "SUR" in feat_set:     parts.append("فاء الفجاءة (بادئة)")
            elif "INL" in feat_set:     parts.append("حرف مقطع (بادئة)")
            else:
                lem = next((v.split(":")[1] for v in features if v.startswith("LEM:")), "")
                parts.append(f"حرف (بادئة){' (' + lem + ')' if lem else ''}")
        elif is_suff:
            if "PRON" in feat_set:
                person = next((PERSON_LABELS[p] for p in PERSON_LABELS if p in feat_set), "ضمير")
                parts.append(f"ضمير متصل ({person})")
            else:
                parts.append("لاحقة")
        else:
            # Standalone particle
            for feat_key, feat_val in [
                ("DET", "أداة التعريف"),
                ("P",   "حرف جر"),
                ("CONJ","حرف عطف"),
                ("NEG", "حرف نفي"),
                ("SUB", "حرف مصدري"),
                ("ACC", "حرف نصب"),
                ("EMPH","لام التوكيد"),
                ("FUT", "حرف استقبال"),
                ("VOC", "حرف نداء"),
                ("REM", "حرف استئناف"),
                ("CERT","حرف تحقيق"),
                ("RSLT","حرف جواب الشرط"),
                ("CAUS","حرف سببية"),
                ("AMD", "حرف استدراك"),
                ("EXP", "أداة استثناء"),
                ("PRO", "حرف نهي"),
                ("ATT", "حرف تنبيه"),
                ("INTG","حرف استفهام"),
                ("INC", "حرف ابتداء"),
                ("INL", "حروف مقطعة"),
            ]:
                if feat_key in feat_set:
                    lem = next((v.split(":")[1] for v in features if v.startswith("LEM:")), "")
                    parts.append(f"{feat_val}{' (' + lem + ')' if lem else ''}")
                    break
            if not parts:
                lem = next((v.split(":")[1] for v in features if v.startswith("LEM:")), "")
                parts.append(f"حرف{' (' + lem + ')' if lem else ''}")

    # ── ROOT ──────────────────────────────────────────────────────────────────
    root = next((v.split(":")[1] for v in features if v.startswith("ROOT:")), None)
    if root and seg_type in ("N", "V"):
        parts.append(f"الجذر: {root}")

    return "، ".join(parts) if parts else seg_type


def parse_morphology():
    """Parse quran-morphology.txt → {surah: {ayah: {word: [segments]}}}"""
    data: dict[int, dict[int, dict[int, list]]] = collections.defaultdict(
        lambda: collections.defaultdict(lambda: collections.defaultdict(list))
    )

    with open(MORPHOLOGY_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 4:
                continue
            loc, form, seg_type, feat_str = parts[0], parts[1], parts[2], parts[3]
            loc_parts = loc.split(":")
            if len(loc_parts) != 4:
                continue
            s, a, w, seg_idx = int(loc_parts[0]), int(loc_parts[1]), int(loc_parts[2]), int(loc_parts[3])
            features = feat_str.split("|")
            label = build_arabic_label(seg_type, features)

            # Extract lemma & root for display
            lemma = next((v.split(":")[1] for v in features if v.startswith("LEM:")), "")
            root  = next((v.split(":")[1] for v in features if v.startswith("ROOT:")), "")

            data[s][a][w].append({
                "segment": seg_idx,
                "form": form,
                "type": seg_type,
                "features": feat_str,
                "lemma": lemma,
                "root": root,
                "irab": label,
            })
    return data


def build_surah_json(surah_num: int, surah_data: dict) -> dict:
    ayahs_list = []
    for ayah_num in sorted(surah_data.keys()):
        words_list = []
        for word_num in sorted(surah_data[ayah_num].keys()):
            segs = surah_data[ayah_num][word_num]
            full_form = "".join(s["form"] for s in segs)
            # Build combined إعراب: join non-prefix/suffix segments
            irab_parts = [s["irab"] for s in segs if s["irab"]]
            words_list.append({
                "word": word_num,
                "form": full_form,
                "segments": segs,
                "irab": " + ".join(irab_parts),
            })
        ayahs_list.append({"ayah": ayah_num, "words": words_list})

    return {
        "surah": {"number": surah_num, "name": SURAH_NAMES[surah_num - 1]},
        "source": SOURCE,
        "ayahs": ayahs_list,
    }


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print("Parsing morphology file...", flush=True)
    data = parse_morphology()
    print(f"Parsed {len(data)} surahs, writing JSON files...", flush=True)

    index_surahs = []
    for surah_num in sorted(data.keys()):
        obj = build_surah_json(surah_num, data[surah_num])
        path = f"{OUTPUT_DIR}/surah_{surah_num:03d}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        ayah_count = len(obj["ayahs"])
        word_count = sum(len(a["words"]) for a in obj["ayahs"])
        print(f"  Surah {surah_num:3d} {SURAH_NAMES[surah_num-1]:15s}: {ayah_count} آيات، {word_count} كلمة", flush=True)
        index_surahs.append({
            "number": surah_num,
            "name": SURAH_NAMES[surah_num - 1],
            "file": f"surah_{surah_num:03d}.json",
            "ayahCount": ayah_count,
            "wordCount": word_count,
        })

    # Also save terms
    with open(TERMS_FILE, encoding="utf-8") as f:
        terms = json.load(f)
    with open(f"{OUTPUT_DIR}/morphology-terms.json", "w", encoding="utf-8") as f:
        json.dump(terms, f, ensure_ascii=False, indent=2)

    # Save index
    index = {"source": SOURCE, "surahs": index_surahs}
    with open(f"{OUTPUT_DIR}/index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(index_surahs)} surah files + index.json", flush=True)


if __name__ == "__main__":
    main()

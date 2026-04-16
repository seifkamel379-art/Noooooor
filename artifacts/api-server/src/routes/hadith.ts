import { Router } from "express";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const API_KEY =
  process.env.HADITH_API_KEY ||
  "$2y$10$zSijdF10JGzOS8ZyQDf5xO1rYuVOiEWV71IogIVeivmQXGjGxkS";

const BASE = "https://hadithapi.com/api";

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 8000 }, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error("Invalid JSON from hadithapi.com"));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
  });
}

/* ── Local Sunnah data for search fallback ── */
interface LocalHadith {
  id: string;
  title: string;
  hadith: string;
  source: string;
  description?: string;
  reward?: string;
  category?: string;
  subcategory?: string;
}

let _localHadiths: LocalHadith[] | null = null;

function loadLocalHadiths(): LocalHadith[] {
  if (_localHadiths) return _localHadiths;

  const dataPath = path.resolve(
    __dirname,
    "../../../noor/public/data/sunnah.json"
  );

  try {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw) as {
      content: Record<string, Record<string, Array<{
        id: string; title: string; hadith: string; source: string; description?: string; reward?: string;
      }>>>;
    };

    const flattened: LocalHadith[] = [];
    for (const [cat, subcats] of Object.entries(data.content)) {
      for (const [subcat, hadiths] of Object.entries(subcats)) {
        for (const h of hadiths) {
          flattened.push({ ...h, category: cat, subcategory: subcat });
        }
      }
    }
    _localHadiths = flattened;
    return flattened;
  } catch (e) {
    console.error("Failed to load local hadiths:", e);
    _localHadiths = [];
    return [];
  }
}

/** Strip Arabic diacritics (tashkeel) so search works without them */
function stripTashkeel(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "");
}

function sourceToBookSlug(source: string): string {
  if (source.includes("البخاري")) return "sahih-bukhari";
  if (source.includes("مسلم")) return "sahih-muslim";
  if (source.includes("الترمذي")) return "al-tirmidhi";
  if (source.includes("أبي داود") || source.includes("أبو داود")) return "abu-dawood";
  if (source.includes("ابن ماجه")) return "ibn-e-majah";
  if (source.includes("النسائي")) return "sunan-nasai";
  return "sahih-bukhari";
}

function localSearch(query: string, paginate = 20, page = 1) {
  const hadiths = loadLocalHadiths();
  const q = stripTashkeel(query.trim());

  const matches = hadiths.filter(h =>
    stripTashkeel(h.hadith).includes(q) ||
    stripTashkeel(h.title).includes(q) ||
    stripTashkeel(h.description ?? "").includes(q)
  );

  const start = (page - 1) * paginate;
  const pageData = matches.slice(start, start + paginate);

  const data = pageData.map((h, i) => ({
    id: start + i + 1,
    hadithNumber: String(start + i + 1),
    hadithArabic: h.hadith,
    hadithEnglish: h.description ?? "",
    englishNarrator: h.title,
    bookSlug: sourceToBookSlug(h.source),
    book: { bookName: h.source },
  }));

  return {
    status: 200,
    hadiths: {
      current_page: page,
      last_page: Math.ceil(matches.length / paginate) || 1,
      total: matches.length,
      data,
    },
    source: "local",
  };
}

router.get("/hadith/books", async (_req, res) => {
  try {
    const data = await httpsGet(`${BASE}/books?apiKey=${encodeURIComponent(API_KEY)}`);
    res.json(data);
  } catch {
    res.status(503).json({ error: "الخادم الخارجي غير متاح حالياً" });
  }
});

router.get("/hadith/hadiths", async (req, res) => {
  const { book, chapter, page = "1", paginate = "10" } = req.query as Record<string, string>;
  if (!book) { res.status(400).json({ error: "book is required" }); return; }
  try {
    let url = `${BASE}/hadiths?apiKey=${encodeURIComponent(API_KEY)}&book=${encodeURIComponent(book)}&paginate=${paginate}&page=${page}`;
    if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
    const data = await httpsGet(url);
    res.json(data);
  } catch {
    res.status(503).json({ error: "الخادم الخارجي غير متاح حالياً" });
  }
});

router.get("/hadith/search", (req, res) => {
  const { query, page = "1", paginate = "20" } = req.query as Record<string, string>;
  if (!query?.trim()) { res.status(400).json({ error: "query is required" }); return; }
  const result = localSearch(query.trim(), parseInt(paginate), parseInt(page));
  res.json(result);
});

router.get("/hadith/chapters/:book", async (req, res) => {
  const { book } = req.params;
  try {
    const data = await httpsGet(
      `${BASE}/${encodeURIComponent(book)}/chapters?apiKey=${encodeURIComponent(API_KEY)}`
    );
    res.json(data);
  } catch {
    res.status(503).json({ error: "الخادم الخارجي غير متاح حالياً" });
  }
});

export default router;

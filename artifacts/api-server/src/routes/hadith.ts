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

const PUBLIC_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

const BOOKS = [
  { slug: "sahih-bukhari", name: "صحيح البخاري", edition: "ara-bukhari" },
  { slug: "sahih-muslim", name: "صحيح مسلم", edition: "ara-muslim" },
  { slug: "al-tirmidhi", name: "جامع الترمذي", edition: "ara-tirmidhi" },
  { slug: "abu-dawood", name: "سنن أبي داود", edition: "ara-abudawud" },
  { slug: "ibn-e-majah", name: "سنن ابن ماجه", edition: "ara-ibnmajah" },
  { slug: "sunan-nasai", name: "سنن النسائي", edition: "ara-nasai" },
] as const;

type BookSlug = (typeof BOOKS)[number]["slug"];

interface PublicHadith {
  hadithnumber: number | string;
  arabicnumber?: number | string;
  text: string;
  reference?: {
    book?: number | string;
    hadith?: number | string;
  };
}

interface PublicBookData {
  hadiths: PublicHadith[];
}

const publicBookCache = new Map<BookSlug, PublicHadith[]>();
const publicBookLoading = new Map<BookSlug, Promise<PublicHadith[]>>();

function httpsGet(url: string, timeoutMs = 30000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
        } catch {
          reject(new Error("Invalid JSON from hadith CDN"));
        }
      });
    });
    req.on("timeout", () => { req.destroy(); reject(new Error("Request timed out")); });
    req.on("error", reject);
  });
}

function getBook(slug: string) {
  return BOOKS.find((book) => book.slug === slug);
}

function makeHadithId(bookSlug: string, hadithNumber: number) {
  const bookIndex = Math.max(0, BOOKS.findIndex((book) => book.slug === bookSlug));
  return (bookIndex + 1) * 100000 + hadithNumber;
}

async function loadPublicBook(bookSlug: BookSlug): Promise<PublicHadith[]> {
  const cached = publicBookCache.get(bookSlug);
  if (cached) return cached;

  const inflight = publicBookLoading.get(bookSlug);
  if (inflight) return inflight;

  const book = getBook(bookSlug);
  if (!book) return [];

  const request = httpsGet(`${PUBLIC_BASE}/${book.edition}.json`, 60000)
    .then((data) => {
      const parsed = data as PublicBookData;
      const hadiths = Array.isArray(parsed.hadiths) ? parsed.hadiths : [];
      publicBookCache.set(bookSlug, hadiths);
      publicBookLoading.delete(bookSlug);
      console.log(`[Hadith] Cached ${book.name}: ${hadiths.length} hadiths`);
      return hadiths;
    })
    .catch((err) => {
      publicBookLoading.delete(bookSlug);
      console.error(`[Hadith] Failed to load ${book.name}:`, err.message);
      return [] as PublicHadith[];
    });

  publicBookLoading.set(bookSlug, request);
  return request;
}

export async function prewarmHadithCache(): Promise<void> {
  console.log("[Hadith] Pre-warming book cache in background...");
  for (const book of BOOKS) {
    loadPublicBook(book.slug).catch(() => {});
  }
}

function toHadithItem(bookSlug: BookSlug, hadith: PublicHadith) {
  const book = getBook(bookSlug);
  const hadithNumber = Number(hadith.hadithnumber || hadith.arabicnumber || 0);
  const safeNumber = Number.isFinite(hadithNumber) && hadithNumber > 0 ? hadithNumber : 1;

  return {
    id: makeHadithId(bookSlug, safeNumber),
    hadithNumber: String(safeNumber),
    hadithArabic: hadith.text,
    bookSlug,
    book: { bookName: book?.name ?? bookSlug },
  };
}

async function publicBookPage(bookSlug: BookSlug, paginate = 10, page = 1) {
  const hadiths = await loadPublicBook(bookSlug);
  const safePaginate = Number.isFinite(paginate) && paginate > 0 ? paginate : 10;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const start = (safePage - 1) * safePaginate;
  const pageData = hadiths.slice(start, start + safePaginate).map((hadith) => toHadithItem(bookSlug, hadith));

  return {
    status: 200,
    hadiths: {
      current_page: safePage,
      last_page: Math.ceil(hadiths.length / safePaginate) || 1,
      total: hadiths.length,
      data: pageData,
    },
    source: "public",
  };
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
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ـ"“”'‘’.,،:؛!?؟()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const q = normalizeArabic(query.trim());

  const matches = hadiths.filter(h =>
    normalizeArabic(h.hadith).includes(q) ||
    normalizeArabic(h.title).includes(q) ||
    normalizeArabic(h.description ?? "").includes(q)
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

async function publicSearch(query: string, paginate = 20, page = 1) {
  const q = normalizeArabic(query);
  const safePaginate = Number.isFinite(paginate) && paginate > 0 ? paginate : 20;
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const allBooks = await Promise.all(
    BOOKS.map(async (book) => {
      const hadiths = await loadPublicBook(book.slug);
      return hadiths
        .filter((hadith) => normalizeArabic(hadith.text).includes(q))
        .map((hadith) => toHadithItem(book.slug, hadith));
    })
  );
  const matches = allBooks.flat();
  const start = (safePage - 1) * safePaginate;

  return {
    status: 200,
    hadiths: {
      current_page: safePage,
      last_page: Math.ceil(matches.length / safePaginate) || 1,
      total: matches.length,
      data: matches.slice(start, start + safePaginate),
    },
    source: "public",
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
  const publicBook = getBook(book);
  if (publicBook) {
    try {
      const data = await publicBookPage(publicBook.slug, parseInt(paginate), parseInt(page));
      res.json(data);
      return;
    } catch (err) {
      console.error("Public hadith dataset failed:", err);
    }
  }
  try {
    let url = `${BASE}/hadiths?apiKey=${encodeURIComponent(API_KEY)}&book=${encodeURIComponent(book)}&paginate=${paginate}&page=${page}`;
    if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
    const data = await httpsGet(url);
    res.json(data);
  } catch {
    res.status(503).json({ error: "الخادم الخارجي غير متاح حالياً" });
  }
});

router.get("/hadith/search", async (req, res) => {
  const { query, page = "1", paginate = "20" } = req.query as Record<string, string>;
  if (!query?.trim()) { res.status(400).json({ error: "query is required" }); return; }

  const cachedBooksCount = publicBookCache.size;
  try {
    const result = await publicSearch(query.trim(), parseInt(paginate), parseInt(page));
    if (result.hadiths.total > 0) {
      res.json(result);
      return;
    }
    if (cachedBooksCount === 0) {
      res.json({
        status: 200,
        hadiths: { current_page: 1, last_page: 1, total: 0, data: [] },
        loading: true,
      });
      return;
    }
  } catch (err) {
    console.error("Public hadith search failed:", err);
  }
  const fallback = localSearch(query.trim(), parseInt(paginate), parseInt(page));
  res.json(fallback);
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

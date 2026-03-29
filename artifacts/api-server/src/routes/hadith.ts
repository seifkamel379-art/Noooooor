import { Router } from "express";
import https from "https";

const router = Router();

const API_KEY = process.env.HADITH_API_KEY;
const BASE = "https://hadithapi.com/api";

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error("Invalid JSON from hadithapi.com")); }
      });
    }).on("error", reject);
  });
}

router.get("/hadith/books", async (_req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "HADITH_API_KEY not configured" });
  try {
    const data = await httpsGet(`${BASE}/books?apiKey=${API_KEY}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

router.get("/hadith/hadiths", async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "HADITH_API_KEY not configured" });
  const { book, chapter, page = "1", paginate = "10" } = req.query as Record<string, string>;
  if (!book) return res.status(400).json({ error: "book is required" });
  try {
    let url = `${BASE}/hadiths?apiKey=${API_KEY}&book=${encodeURIComponent(book)}&paginate=${paginate}&page=${page}`;
    if (chapter) url += `&chapter=${encodeURIComponent(chapter)}`;
    const data = await httpsGet(url);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch hadiths" });
  }
});

router.get("/hadith/chapters/:book", async (req, res) => {
  if (!API_KEY) return res.status(503).json({ error: "HADITH_API_KEY not configured" });
  const { book } = req.params;
  try {
    const data = await httpsGet(`${BASE}/${encodeURIComponent(book)}/chapters?apiKey=${API_KEY}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

export default router;

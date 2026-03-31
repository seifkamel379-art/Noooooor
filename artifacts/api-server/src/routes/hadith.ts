import { Router } from "express";
import https from "https";

const router = Router();

const API_KEY =
  process.env.HADITH_API_KEY ||
  "$2y$10$zSijdF10JGzOS8ZyQDf5xO1rYuVOiEWV71IogIVeivmQXGjGxkS";

const BASE = "https://hadithapi.com/api";

function httpsGet(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(raw));
          } catch {
            reject(new Error("Invalid JSON from hadithapi.com"));
          }
        });
      })
      .on("error", reject);
  });
}

router.get("/hadith/books", async (_req, res) => {
  try {
    const data = await httpsGet(`${BASE}/books?apiKey=${encodeURIComponent(API_KEY)}`);
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch books" });
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
    res.status(500).json({ error: "Failed to fetch hadiths" });
  }
});

router.get("/hadith/chapters/:book", async (req, res) => {
  const { book } = req.params;
  try {
    const data = await httpsGet(
      `${BASE}/${encodeURIComponent(book)}/chapters?apiKey=${encodeURIComponent(API_KEY)}`
    );
    res.json(data);
  } catch {
    res.status(500).json({ error: "Failed to fetch chapters" });
  }
});

export default router;

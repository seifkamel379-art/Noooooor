import { Router } from "express";

const router = Router();

/* Base domains — subdomains are also covered via endsWith check below */
const ALLOWED_HOSTS = [
  "everyayah.com",
  "cdn.islamic.network",
  "mp3quran.net",
  "verses.quran.com",
  "qurancdn.com",
  "quranicaudio.com",
  "download.quranicaudio.com",
  "podcasts.qurancentral.com",
  "qurancentral.com",
  "archive.org",
  "quran.ksu.edu.sa",
  "ksu.edu.sa",
  "islamic.network",
];

router.get("/audio-proxy", async (req, res) => {
  const rawUrl = req.query.url as string | undefined;
  if (!rawUrl) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  if (!ALLOWED_HOSTS.some(h => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))) {
    res.status(403).json({ error: "Host not allowed" });
    return;
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: { "User-Agent": "NoorApp/2.0" },
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream error" });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Access-Control-Allow-Origin", "*");

    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("[audio-proxy] error:", err);
    res.status(502).json({ error: "Proxy fetch failed" });
  }
});

export default router;

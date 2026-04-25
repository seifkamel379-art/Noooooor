import { Router, type IRouter } from "express";
import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";

const router: IRouter = Router();

const ROOT_DIR = path.resolve(process.cwd(), "../..");
const NOOR_DIR = path.join(ROOT_DIR, "artifacts", "noor");
const SRC_DIR = path.join(NOOR_DIR, "src");

const ALLOWED_DIRS = [
  path.join(SRC_DIR, "components"),
  path.join(SRC_DIR, "pages"),
];

const ALLOWED_FILES = [
  path.join(SRC_DIR, "index.css"),
  path.join(SRC_DIR, "App.tsx"),
  path.join(SRC_DIR, "main.tsx"),
  path.join(NOOR_DIR, "index.html"),
  path.join(NOOR_DIR, "components.json"),
];

type FileEntry = {
  path: string;
  name: string;
  size: number;
  category: string;
};

async function walkDir(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        out.push(...(await walkDir(full, base)));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if ([".tsx", ".ts", ".css", ".json", ".html"].includes(ext)) {
          out.push(path.relative(base, full));
        }
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

function categorize(rel: string): string {
  if (rel === "src/index.css") return "الثيم والألوان";
  if (rel === "index.html") return "ملف HTML الرئيسي";
  if (rel === "components.json") return "إعدادات shadcn";
  if (rel === "src/App.tsx" || rel === "src/main.tsx") return "نقطة بداية التطبيق";
  if (rel.startsWith("src/components/ui/")) return "مكونات shadcn UI";
  if (rel.startsWith("src/components/layout/")) return "الـ Layout";
  if (rel.startsWith("src/components/")) return "مكونات مخصصة";
  if (rel.startsWith("src/pages/")) return "صفحات التطبيق";
  return "أخرى";
}

router.get("/design-files", async (_req, res) => {
  try {
    const files: FileEntry[] = [];

    for (const f of ALLOWED_FILES) {
      try {
        const stat = await fs.stat(f);
        const rel = path.relative(NOOR_DIR, f);
        files.push({
          path: rel,
          name: path.basename(f),
          size: stat.size,
          category: categorize(rel),
        });
      } catch {
        /* ignore */
      }
    }

    for (const dir of ALLOWED_DIRS) {
      const entries = await walkDir(dir, NOOR_DIR);
      for (const rel of entries) {
        try {
          const stat = await fs.stat(path.join(NOOR_DIR, rel));
          files.push({
            path: rel,
            name: path.basename(rel),
            size: stat.size,
            category: categorize(rel),
          });
        } catch {
          /* ignore */
        }
      }
    }

    files.sort((a, b) => a.path.localeCompare(b.path));
    res.json({ files });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "internal error" });
  }
});

router.get("/design-files/zip", async (_req, res) => {
  try {
    const zip = new JSZip();

    for (const f of ALLOWED_FILES) {
      try {
        const content = await fs.readFile(f);
        const rel = path.relative(NOOR_DIR, f);
        zip.file(rel, content);
      } catch {
        /* ignore missing */
      }
    }

    for (const dir of ALLOWED_DIRS) {
      const entries = await walkDir(dir, NOOR_DIR);
      for (const rel of entries) {
        try {
          const content = await fs.readFile(path.join(NOOR_DIR, rel));
          zip.file(rel, content);
        } catch {
          /* ignore */
        }
      }
    }

    const buffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filename = "noor-design-files.zip";
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader("Content-Length", String(buffer.length));
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "internal error" });
  }
});

router.get("/design-files/raw", async (req, res) => {
  const rel = req.query.path;
  if (typeof rel !== "string" || !rel) {
    res.status(400).json({ error: "path query parameter is required" });
    return;
  }

  const full = path.resolve(NOOR_DIR, rel);
  if (!full.startsWith(NOOR_DIR + path.sep)) {
    res.status(403).json({ error: "path not allowed" });
    return;
  }

  const isAllowedFile = ALLOWED_FILES.includes(full);
  const isInAllowedDir = ALLOWED_DIRS.some((d) => full.startsWith(d + path.sep));
  if (!isAllowedFile && !isInAllowedDir) {
    res.status(403).json({ error: "path not allowed" });
    return;
  }

  try {
    const content = await fs.readFile(full);
    const filename = path.basename(full);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(content);
  } catch (err: any) {
    res.status(404).json({ error: "file not found" });
  }
});

export default router;

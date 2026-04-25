import { useEffect, useMemo, useState } from "react";
import { Download, FileCode, Loader2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FileEntry = {
  path: string;
  name: string;
  size: number;
  category: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const CATEGORY_ORDER = [
  "الثيم والألوان",
  "نقطة بداية التطبيق",
  "ملف HTML الرئيسي",
  "إعدادات shadcn",
  "الـ Layout",
  "مكونات مخصصة",
  "صفحات التطبيق",
  "مكونات shadcn UI",
  "أخرى",
];

export function DesignFiles() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/design-files")
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message || "تعذّر تحميل قائمة الملفات");
        setLoading(false);
      });
  }, []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? files.filter((f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
      : files;

    const map = new Map<string, FileEntry[]>();
    for (const f of filtered) {
      const list = map.get(f.category) || [];
      list.push(f);
      map.set(f.category, list);
    }

    const ordered: { category: string; entries: FileEntry[] }[] = [];
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) {
        ordered.push({ category: cat, entries: map.get(cat)! });
        map.delete(cat);
      }
    }
    for (const [cat, entries] of map.entries()) {
      ordered.push({ category: cat, entries });
    }
    return ordered;
  }, [files, query]);

  const totalCount = files.length;
  const filteredCount = grouped.reduce((s, g) => s + g.entries.length, 0);

  const downloadOne = (filePath: string) => {
    const url = `/api/design-files/raw?path=${encodeURIComponent(filePath)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filePath.split("/").pop() || "file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllInGroup = async (entries: FileEntry[]) => {
    for (const f of entries) {
      downloadOne(f.path);
      await new Promise((r) => setTimeout(r, 250));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground p-4 pb-24" data-testid="page-design-files">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-1" data-testid="text-design-files-title">
            ملفات التصميم
          </h1>
          <p className="text-muted-foreground text-sm">
            دوس على أي ملف لتحميله ({totalCount} ملف إجمالي)
          </p>
        </header>

        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث عن ملف..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-10"
            data-testid="input-search-files"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16" data-testid="status-loading">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="mr-2 text-muted-foreground">جارٍ التحميل...</span>
          </div>
        )}

        {error && (
          <Card className="p-6 border-destructive text-center" data-testid="status-error">
            <p className="text-destructive">{error}</p>
          </Card>
        )}

        {!loading && !error && filteredCount === 0 && (
          <Card className="p-6 text-center text-muted-foreground" data-testid="status-empty">
            مفيش ملفات مطابقة للبحث
          </Card>
        )}

        {!loading && !error && grouped.map(({ category, entries }) => (
          <section key={category} className="mb-6" data-testid={`section-${category}`}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-primary">
                {category} <span className="text-sm text-muted-foreground">({entries.length})</span>
              </h2>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadAllInGroup(entries)}
                  data-testid={`button-download-all-${category}`}
                >
                  <Download className="h-4 w-4 ml-1" />
                  حمّل الكل
                </Button>
              )}
            </div>
            <Card className="divide-y divide-border overflow-hidden">
              {entries.map((f) => (
                <button
                  key={f.path}
                  onClick={() => downloadOne(f.path)}
                  className="w-full flex items-center gap-3 p-3 hover-elevate active-elevate-2 text-right transition-colors"
                  data-testid={`button-download-${f.path}`}
                >
                  <FileCode className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" data-testid={`text-name-${f.path}`}>
                      {f.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate font-mono" dir="ltr">
                      {f.path}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatSize(f.size)}
                  </span>
                  <Download className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}

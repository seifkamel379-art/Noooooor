import { Router, type Request, type Response } from "express";
import { db, globalCounter, sohbaLeaderboard } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

let cachedCount: number = 0;
let pendingWrites = 0;
const WRITE_BATCH = 20;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let dbInitialized = false;

/* Track unique sessions (one per browser tab/session) */
const sseClients = new Map<string, Response>();

async function initCounter() {
  try {
    const rows = await db.select().from(globalCounter).limit(1);
    if (rows.length > 0) {
      cachedCount = rows[0].totalCount;
    } else {
      await db.insert(globalCounter).values({ totalCount: 0 });
      cachedCount = 0;
    }
    dbInitialized = true;
    console.log(`[GlobalCounter] Loaded count: ${cachedCount}`);
  } catch (err) {
    console.error("[GlobalCounter] Failed to init:", err);
    dbInitialized = true;
  }
}

initCounter();

function broadcastToAll(data: { count: number; activeUsers: number }) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  for (const [, client] of sseClients) {
    try {
      client.write(msg);
    } catch {
      /* client disconnected – will be cleaned up on close event */
    }
  }
}

async function flushToDB() {
  if (pendingWrites === 0) return;
  try {
    await db
      .update(globalCounter)
      .set({ totalCount: cachedCount, updatedAt: new Date() })
      .where(eq(globalCounter.id, 1));
    pendingWrites = 0;
  } catch (err) {
    console.error("[GlobalCounter] DB write error:", err);
  }
  writeTimer = null;
}

function scheduleWrite() {
  pendingWrites++;
  if (pendingWrites >= WRITE_BATCH) {
    if (writeTimer) clearTimeout(writeTimer);
    flushToDB();
    return;
  }
  if (!writeTimer) {
    writeTimer = setTimeout(flushToDB, 5000);
  }
}

router.get("/counter", (_req, res) => {
  res.json({ count: cachedCount, activeUsers: sseClients.size });
});

router.get("/counter/stream", (req: Request, res: Response) => {
  /* Each browser session sends a unique sid so returning users aren't
     double-counted when they leave and come back to the page. */
  const sid = (req.query.sid as string | undefined) || `anon-${Date.now()}-${Math.random()}`;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  /* Close any previous connection from the same session */
  const existing = sseClients.get(sid);
  if (existing) {
    try { existing.end(); } catch { /* ignore */ }
  }
  sseClients.set(sid, res);

  res.write(
    `data: ${JSON.stringify({ count: cachedCount, activeUsers: sseClients.size })}\n\n`
  );
  broadcastToAll({ count: cachedCount, activeUsers: sseClients.size });

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(sid);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(sid);
    broadcastToAll({ count: cachedCount, activeUsers: sseClients.size });
  });
});

router.post("/counter/increment", (req: Request, res: Response) => {
  const amount = Number(req.body?.amount) || 1;
  cachedCount += amount;
  scheduleWrite();
  broadcastToAll({ count: cachedCount, activeUsers: sseClients.size });
  res.json({ count: cachedCount });
});

/* Leaderboard sorted by tasbeeh count (public users only) */
router.get("/counter/leaderboard", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(sohbaLeaderboard)
      .where(eq(sohbaLeaderboard.isPublic, true))
      .orderBy(desc(sohbaLeaderboard.tasbeehCount))
      .limit(50);

    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error("[Counter] Leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

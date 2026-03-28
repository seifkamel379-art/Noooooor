import { Router, type Request, type Response } from "express";
import { db, globalCounter } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

let cachedCount: number = 0;
let pendingWrites = 0;
const WRITE_BATCH = 20;
let writeTimer: ReturnType<typeof setTimeout> | null = null;
let dbInitialized = false;

const sseClients = new Set<Response>();

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
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
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
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  sseClients.add(res);

  res.write(
    `data: ${JSON.stringify({ count: cachedCount, activeUsers: sseClients.size })}\n\n`
  );

  broadcastToAll({ count: cachedCount, activeUsers: sseClients.size });

  const heartbeat = setInterval(() => {
    try {
      res.write(": ping\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
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

export default router;

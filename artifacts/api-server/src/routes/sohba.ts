import { Router } from "express";
import { db, sohbaLeaderboard } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.post("/sohba/sync", async (req, res) => {
  try {
    const {
      userId, displayName, governorate, isPublic,
      tasbeehCount, quranCompletions, currentSurah,
      azkarStreak, tadabburStreak, earnedBadges,
    } = req.body;

    if (!userId || !displayName) {
      return res.status(400).json({ error: "userId and displayName are required" });
    }

    const noorScore =
      Math.floor((tasbeehCount || 0) * 0.5) +
      (quranCompletions || 0) * 1000 +
      (azkarStreak || 0) * 50 +
      (tadabburStreak || 0) * 20;

    await db
      .insert(sohbaLeaderboard)
      .values({
        userId,
        displayName,
        governorate: governorate || null,
        isPublic: !!isPublic,
        tasbeehCount: tasbeehCount || 0,
        quranCompletions: quranCompletions || 0,
        currentSurah: currentSurah || 1,
        azkarStreak: azkarStreak || 0,
        tadabburStreak: tadabburStreak || 0,
        noorScore,
        earnedBadges: earnedBadges || [],
      })
      .onConflictDoUpdate({
        target: sohbaLeaderboard.userId,
        set: {
          displayName,
          governorate: governorate || null,
          isPublic: !!isPublic,
          tasbeehCount: tasbeehCount || 0,
          quranCompletions: quranCompletions || 0,
          currentSurah: currentSurah || 1,
          azkarStreak: azkarStreak || 0,
          tadabburStreak: tadabburStreak || 0,
          noorScore,
          earnedBadges: earnedBadges || [],
          updatedAt: new Date(),
        },
      });

    return res.json({ success: true, noorScore });
  } catch (err) {
    console.error("sohba sync error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sohba/leaderboard", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(sohbaLeaderboard)
      .where(eq(sohbaLeaderboard.isPublic, true))
      .orderBy(desc(sohbaLeaderboard.noorScore))
      .limit(50);

    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error("sohba leaderboard error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sohba/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const row = await db
      .select()
      .from(sohbaLeaderboard)
      .where(eq(sohbaLeaderboard.userId, userId))
      .limit(1);

    if (!row.length) return res.json({ entry: null });
    return res.json({ entry: row[0] });
  } catch (err) {
    console.error("sohba user error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

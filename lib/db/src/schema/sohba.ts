import { pgTable, text, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sohbaLeaderboard = pgTable("sohba_leaderboard", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  governorate: text("governorate"),
  isPublic: boolean("is_public").notNull().default(false),
  tasbeehCount: integer("tasbeeh_count").notNull().default(0),
  quranCompletions: integer("quran_completions").notNull().default(0),
  currentSurah: integer("current_surah").notNull().default(1),
  azkarStreak: integer("azkar_streak").notNull().default(0),
  tadabburStreak: integer("tadabbur_streak").notNull().default(0),
  noorScore: integer("noor_score").notNull().default(0),
  earnedBadges: text("earned_badges").array().notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSohbaSchema = createInsertSchema(sohbaLeaderboard).omit({ id: true, updatedAt: true });
export type InsertSohba = z.infer<typeof insertSohbaSchema>;
export type SohbaEntry = typeof sohbaLeaderboard.$inferSelect;

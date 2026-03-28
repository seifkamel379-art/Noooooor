import { pgTable, serial, bigint, integer, timestamp } from "drizzle-orm/pg-core";

export const globalCounter = pgTable("global_counter", {
  id: serial("id").primaryKey(),
  totalCount: bigint("total_count", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type GlobalCounter = typeof globalCounter.$inferSelect;

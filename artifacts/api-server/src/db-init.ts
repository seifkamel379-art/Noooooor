import { pool } from "@workspace/db";

/**
 * Auto-initializes database tables on server startup.
 * Creates all required tables if they don't already exist.
 * This ensures the app works after a fresh clone or environment reset.
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_counter (
        id          SERIAL PRIMARY KEY,
        total_count BIGINT    NOT NULL DEFAULT 0,
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sohba_leaderboard (
        id                SERIAL PRIMARY KEY,
        user_id           TEXT      NOT NULL UNIQUE,
        display_name      TEXT      NOT NULL,
        governorate       TEXT,
        is_public         BOOLEAN   NOT NULL DEFAULT FALSE,
        tasbeeh_count     INTEGER   NOT NULL DEFAULT 0,
        quran_completions INTEGER   NOT NULL DEFAULT 0,
        current_surah     INTEGER   NOT NULL DEFAULT 1,
        azkar_streak      INTEGER   NOT NULL DEFAULT 0,
        tadabbur_streak   INTEGER   NOT NULL DEFAULT 0,
        noor_score        INTEGER   NOT NULL DEFAULT 0,
        earned_badges     TEXT[]    NOT NULL DEFAULT '{}',
        updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    /* Ensure the global_counter always has at least one row */
    await client.query(`
      INSERT INTO global_counter (total_count)
      SELECT 0
      WHERE NOT EXISTS (SELECT 1 FROM global_counter);
    `);

    console.log("[DB] Database schema verified ✓");
  } catch (err) {
    console.error("[DB] Schema initialization failed:", err);
  } finally {
    client.release();
  }
}

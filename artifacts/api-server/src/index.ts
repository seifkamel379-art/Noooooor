import app from "./app";
import { initDatabase } from "./db-init";
import { initCounter } from "./routes/counter";
import { prewarmHadithCache } from "./routes/hadith";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

/* Auto-initialize the database schema, then start serving */
initDatabase().then(async () => {
  await initCounter();
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    prewarmHadithCache();
  });
}).catch((err) => {
  /* If DB init fails, still start the server so the frontend loads */
  console.error("[Startup] DB init error:", err);
  app.listen(port, () => {
    console.log(`Server listening on port ${port} (DB may not be fully initialized)`);
    prewarmHadithCache();
  });
});

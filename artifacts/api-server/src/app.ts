import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the built frontend static files
// __dirname resolves to artifacts/api-server/src at build time (esbuild),
// so ../dist/public always points to artifacts/api-server/dist/public
const staticDir = path.join(__dirname, "../dist/public");
app.use(express.static(staticDir));

// SPA fallback — serve index.html for all unmatched routes
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

export default app;

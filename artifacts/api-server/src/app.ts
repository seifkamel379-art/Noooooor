import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const staticDir = path.join(__dirname, "../dist/public");
  app.use(express.static(staticDir));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;

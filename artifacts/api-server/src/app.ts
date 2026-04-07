import express, { type Express } from "express";
import cors from "cors";
import path from "path";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

/* Serve the frontend static build.
   In development the Vite dev server runs on a separate port, so we serve
   the pre-built dist/public here as a fallback.  In production the built
   bundle is the canonical frontend. */
const staticDir = path.resolve(process.cwd(), "dist", "public");
app.use(express.static(staticDir));
app.get("/{*path}", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

export default app;

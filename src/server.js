import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { createApiRouter } from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const outputDir = path.join(rootDir, "generated");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(publicDir));
app.use("/generated", express.static(outputDir));

app.use("/api", createApiRouter(outputDir));

app.get("/share/:token", (_req, res) => {
	res.sendFile(path.join(publicDir, "share.html"));
});

app.get("*", (_req, res) => {
	res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
	console.log(`Slide deck generator running at http://localhost:${port}`);
});

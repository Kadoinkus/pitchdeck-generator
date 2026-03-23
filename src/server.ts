// @ts-nocheck
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { createApiRouter } from "./routes/api.js";
import type { ViteDevServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
void __filename;
void __dirname;
const rootDir = process.cwd();
const clientRootDir = path.join(rootDir, "src", "client");
const outputDir = path.join(rootDir, "generated");
const clientDistDir = path.join(rootDir, "dist", "client");

const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

async function createFrontendRenderer() {
	let vite: ViteDevServer | null = null;

	if (isProduction) {
		app.use(express.static(clientDistDir));
	} else {
		const { createServer } = await import("vite");
		vite = await createServer({
			root: clientRootDir,
			appType: "custom",
			server: {
				middlewareMode: true,
			},
		});
		app.use(vite.middlewares);
	}

	return async function renderPage(templateName: "index" | "share", url: string) {
		if (vite) {
			const templatePath = path.join(clientRootDir, `${templateName}.html`);
			const template = await vite.transformIndexHtml(
				url,
				await fs.readFile(templatePath, "utf8"),
			);
			return template;
		}

		const builtTemplatePath = path.join(clientDistDir, `${templateName}.html`);
		return await fs.readFile(builtTemplatePath, "utf8");
	};
}

async function bootstrap() {
	const renderPage = await createFrontendRenderer();

	app.use(cors());
	app.use(express.json({ limit: "10mb" }));
	app.use("/generated", express.static(outputDir));

	app.use("/api", createApiRouter(outputDir));

	app.get("/share/:token", async (req, res, next) => {
		try {
			res.status(200).type("html").send(await renderPage("share", req.originalUrl));
		} catch (error) {
			next(error);
		}
	});

	app.get("*", async (req, res, next) => {
		try {
			res.status(200).type("html").send(await renderPage("index", req.originalUrl));
		} catch (error) {
			next(error);
		}
	});

	app.listen(port, () => {
		console.log(`Slide deck generator running at http://localhost:${port}`);
	});
}

bootstrap().catch((error) => {
	console.error("Server bootstrap failed:", error);
	process.exit(1);
});


// @ts-nocheck

import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { createApiRouter } from './src/routes/api.ts';

function createApiApp(outputDir: string) {
	const app = express();
	app.use(cors());
	app.use(express.json({ limit: '10mb' }));
	app.use('/generated', express.static(outputDir));
	app.use('/api', createApiRouter(outputDir));
	return app;
}

function isShareRoute(url: string | undefined) {
	return typeof url === 'string' && url.indexOf('/share/') === 0;
}

function createShareRouteHandler(
	shareTemplatePath: string,
	transform: ((url: string, html: string) => unknown) | null,
) {
	return (req, res, next): void => {
		if (!isShareRoute(req.url)) {
			next();
			return;
		}

		void fs
			.readFile(shareTemplatePath, 'utf8')
			.then((template) => {
				if (transform === null) {
					return template;
				}

				const url = typeof req.url === 'string' ? req.url : '/share';
				return transform(url, template);
			})
			.then((html) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'text/html');
				res.end(html);
			})
			.catch((error: unknown) => {
				next(error);
			});
	};
}

export default defineConfig({
	root: 'src/client',
	publicDir: false,
	plugins: [
		{
			name: 'api-in-vite',
			configureServer(server) {
				const outputDir = resolve(__dirname, 'generated');
				const shareTemplatePath = resolve(__dirname, 'src/client/share.html');
				server.middlewares.use(createApiApp(outputDir));
				server.middlewares.use(
					createShareRouteHandler(shareTemplatePath, server.transformIndexHtml),
				);
			},
			configurePreviewServer(server) {
				const outputDir = resolve(__dirname, 'generated');
				const shareTemplatePath = resolve(__dirname, 'dist/client/share.html');
				server.middlewares.use(createApiApp(outputDir));
				server.middlewares.use(
					createShareRouteHandler(shareTemplatePath, null),
				);
			},
		},
	],
	build: {
		outDir: '../../dist/client',
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'src/client/index.html'),
				share: resolve(__dirname, 'src/client/share.html'),
			},
		},
	},
});

import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import svgToIco from 'vite-svg-to-ico';

export default defineConfig({
	root: 'src/client',
	appType: 'mpa',
	publicDir: false,
	plugins: [
		svgToIco({ input: `${import.meta.dirname}/src/client/favicon.svg`, emit: { source: true } }),
		{
			name: 'vite-owns-non-api',
			configureServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (
						typeof req.url === 'string'
						&& req.url.startsWith('/share/')
						&& !req.url.startsWith('/share.html')
					) {
						req.url = '/share.html';
					}
					// Nitro's dev middleware skips requests with _nitroHandled.
					// Let Vite handle all non-API routes so HMR and source CSS work.
					if (req.url && !req.url.startsWith('/api/')) {
						Object.assign(req, { _nitroHandled: true });
					}
					next();
				});
			},
			configurePreviewServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (
						typeof req.url === 'string'
						&& req.url.startsWith('/share/')
						&& !req.url.startsWith('/share.html')
					) {
						req.url = '/share.html';
					}
					next();
				});
			},
		},
		nitro({ rootDir: import.meta.dirname }),
	],
	build: {
		outDir: `${import.meta.dirname}/dist/client`,
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: `${import.meta.dirname}/src/client/index.html`,
				share: `${import.meta.dirname}/src/client/share.html`,
			},
		},
	},
	resolve: {
		tsconfigPaths: true,
	},
});

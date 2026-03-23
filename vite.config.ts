import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import svgToIco from 'vite-svg-to-ico';

export default defineConfig({
	root: 'src/client',
	publicDir: false,
	plugins: [
		svgToIco({ input: `${import.meta.dirname}/src/client/favicon.svg`, emit: { source: true } }),
		{
			name: 'share-page-rewrite',
			configureServer(server) {
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
});

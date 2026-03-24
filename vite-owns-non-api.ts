import type { PluginOption } from 'vite';

export function viteOwnsNonApi(): PluginOption {
	return {
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
	};
}

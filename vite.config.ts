import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import svgToIco from 'vite-svg-to-ico';
import { viteOwnsNonApi } from './vite-owns-non-api';

export default defineConfig({
	root: 'src/client',
	appType: 'mpa',
	publicDir: false,
	plugins: [
		svgToIco({ input: `${import.meta.dirname}/src/client/favicon.svg`, emit: { source: true } }),
		nitro({ rootDir: import.meta.dirname }),
		viteOwnsNonApi(),
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

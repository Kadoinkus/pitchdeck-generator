import { defineConfig } from 'vite';
import svgToIco from 'vite-svg-to-ico';

export default defineConfig({
	plugins: [svgToIco({ input: `${import.meta.dirname}/src/client/favicon.svg`, emit: { source: true } })],
	root: 'src/client',
	publicDir: false,
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

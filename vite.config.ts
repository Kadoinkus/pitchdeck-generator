import { defineConfig } from 'vite';

export default defineConfig({
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

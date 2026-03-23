import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	root: "src/client",
	publicDir: false,
	build: {
		outDir: "../../dist/client",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, "src/client/index.html"),
				share: resolve(__dirname, "src/client/share.html"),
			},
		},
	},
});

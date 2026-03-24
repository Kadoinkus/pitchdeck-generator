import autoAdapter from '@sveltejs/adapter-auto';
import type { Config } from '@sveltejs/kit';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { execSync } from 'node:child_process';

const config: Config = {
	preprocess: [
		vitePreprocess({
			// default values
			style: true,
			script: true,
		}),
	],
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: autoAdapter(),
		version: {
			name: (() => {
				try {
					return execSync('git rev-parse HEAD').toString().trim();
				} catch {
					return 'unknown';
				}
			})(),
			pollInterval: 10000,
		},
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) => filename.includes('node_modules') ? undefined : { runes: true },
	},
};

export default config;

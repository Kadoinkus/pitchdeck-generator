import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
	serverDir: './server',
	renderer: {
		template: './src/client/index.html',
		static: true,
	},
	routeRules: {
		'/share/**': { proxy: '/share.html' },
	},
	// commands: {
	// 	preview: '',
	// 	deploy: '',
	// },
	alias: {
		'$server': `${import.meta.dirname}/server`,
		'$client': `${import.meta.dirname}/src`,
	},
});

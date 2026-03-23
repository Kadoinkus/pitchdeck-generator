import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
	serverDir: './server',
	commands: {
		preview: '',
		deploy: '',
	},
	alias: {
		'$server': `${import.meta.dirname}/server`,
		'$client': `${import.meta.dirname}/src`,
	},
	routeRules: {
		'/share/**': { proxy: '/share.html' },
	},
});

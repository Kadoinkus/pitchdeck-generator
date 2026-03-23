import { defineNitroConfig } from 'nitro/config';

export default defineNitroConfig({
	serverDir: true,
	commands: {
		preview: '',
		deploy: '',
	},
	alias: {
		'$server': `${import.meta.dirname}/server`,
		'$client': `${import.meta.dirname}/src`,
	},
	routes: [{ 'src': '/share/:token', 'dest': '/share.html' }],
});

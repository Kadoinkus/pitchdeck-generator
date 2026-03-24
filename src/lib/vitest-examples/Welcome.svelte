<script>
	import { greet } from '$lib/vitest-examples/greet';

	let { host = 'SvelteKit', guest = 'Vitest' } = $props();
</script>

<h1>{greet(host)}</h1>
<p>{greet(guest)}</p>

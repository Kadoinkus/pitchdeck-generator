<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/components/form/deck-form.css';
	import '$lib/slides/deck-slides.css';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon}>
</svelte:head>

{@render children()}

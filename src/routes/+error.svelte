<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Haiku from '$lib/components/Haiku.svelte';
</script>

<div class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<Haiku variant="card" />
	<a href={resolve('/')}>Go home</a>
</div>

<style>
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
		gap: 1rem;
	}

	h1 {
		font-size: 4rem;
		margin: 0;
		color: var(--primary);
		font-family: "DM Sans", sans-serif;
	}

	p {
		color: var(--muted);
		margin: 0;
	}

	a {
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
	}

	a:hover {
		text-decoration: underline;
	}
</style>

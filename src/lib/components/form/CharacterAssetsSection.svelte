<script lang="ts">
	import {
		addCharacterAsset,
		CHARACTER_PLACEMENTS,
		clearAllAssets,
		getCharacterAssets,
		markDirty,
		pushHistory,
		removeCharacterAsset,
		setStatus,
		updateAssetPlacement,
	} from '$lib/stores/editor.svelte.ts';

	const assets = $derived(getCharacterAssets());

	let fileInput: HTMLInputElement | undefined = $state();

	function formatBytes(size: number): string {
		if (!Number.isFinite(size) || size <= 0) return '0 KB';
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	}

	function readFileAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(String(reader.result ?? ''));
			reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
			reader.readAsDataURL(file);
		});
	}

	async function handleUpload(event: Event) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		const files = Array.from(target.files || []);
		if (!files.length) return;

		const maxPerFileBytes = 1.5 * 1024 * 1024;
		const maxAssets = 8;
		const currentCount = assets.length;
		const room = Math.max(0, maxAssets - currentCount);

		if (!room) {
			setStatus(
				'Character asset limit reached (8). Remove one to add another.',
				true,
			);
			target.value = '';
			return;
		}

		const accepted = files.filter((f) => f.type.startsWith('image/')).slice(
			0,
			room,
		);

		for (const file of accepted) {
			if (file.size > maxPerFileBytes) {
				setStatus(`${file.name} is too large (max 1.5MB).`, true);
				continue;
			}
			try {
				const dataUrl = await readFileAsDataUrl(file);
				addCharacterAsset({
					id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					name: file.name,
					size: file.size,
					dataUrl: String(dataUrl),
					placement: 'all-mascot',
				});
			} catch (error) {
				console.error(error);
				setStatus(
					error instanceof Error
						? error.message
						: 'Could not upload one of the images.',
					true,
				);
			}
		}

		target.value = '';
		pushHistory();
		markDirty();
		setStatus('Character assets updated.');
	}

	function handleClear() {
		clearAllAssets();
		pushHistory();
		markDirty();
		setStatus('Character assets cleared.');
	}

	function handleRemove(index: number) {
		removeCharacterAsset(index);
		pushHistory();
		markDirty();
	}

	function handlePlacementChange(index: number, event: Event) {
		const target = event.target;
		if (target instanceof HTMLSelectElement) {
			updateAssetPlacement(index, target.value);
			pushHistory();
			markDirty();
		}
	}
</script>

<details class="form-section">
	<summary>Character Design Assets</summary>
	<div class="section-head compact">
		<p>
			Upload mascot references and choose where they should appear in the deck.
		</p>
	</div>
	<div class="asset-tools">
		<label class="ghost-link upload-btn" for="character-assets-input"
		>Upload images</label>
		<input
			bind:this={fileInput}
			id="character-assets-input"
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={handleUpload}
		>
		<button type="button" class="ghost" onclick={handleClear}>
			Clear assets
		</button>
		<p class="status">
			{#if assets.length}
				{assets.length} character asset{assets.length > 1 ? 's' : ''} ready.
			{:else}
				No character assets uploaded.
			{/if}
		</p>
	</div>
	{#if assets.length > 0}
		<div class="asset-preview-grid">
			{#each assets as asset, index (asset.id)}
				<article class="asset-card">
					<img
						src={asset.dataUrl}
						alt={asset.name || `Character asset ${index + 1}`}
					>
					<div class="asset-meta">
						<p class="asset-name">
							{asset.name || `Asset ${index + 1}`} ({
								formatBytes(asset.size || 0)
							})
						</p>
						<select
							value={asset.placement || 'all-mascot'}
							onchange={(e) => handlePlacementChange(index, e)}
						>
							{#each CHARACTER_PLACEMENTS as opt (opt.value)}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
						<button
							type="button"
							class="ghost small"
							onclick={() => handleRemove(index)}
						>
							Remove
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</details>

<style>
	.asset-tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.upload-btn {
		cursor: pointer;
	}

	.asset-preview-grid {
		margin-top: 10px;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	.asset-card {
		border: 1px solid #d2e0ff;
		border-radius: 12px;
		background: #f9fcff;
		padding: 8px;
		display: grid;
		gap: 8px;
	}

	.asset-card img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border-radius: 9px;
		border: 1px solid #cfdcff;
		background: #eef4ff;
	}

	.asset-meta {
		display: grid;
		gap: 6px;
	}

	.asset-name {
		margin: 0;
		font-size: 0.76rem;
		line-height: 1.35;
		color: #1f3f6f;
		word-break: break-word;
	}

	.asset-meta select {
		width: 100%;
		border: 1px solid #c9dbff;
		border-radius: 8px;
		background: #fff;
		font: inherit;
		font-size: 0.78rem;
		padding: 6px 8px;
	}

	@media (max-width: 1050px) {
		.asset-preview-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.asset-preview-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

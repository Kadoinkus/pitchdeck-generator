<script lang="ts">
	import { HARMONY_MODES } from '$lib/color-palette';
	import type { PalettePresetSuggestion } from '$lib/color-palette';
	import { extractDominantColor } from '$lib/extract-color';
	import { persistDetails } from '$lib/persist-details';
	import * as palette from '$lib/stores/brand-palette.svelte';
	import {
		getPayload,
		handleFieldChange,
		markDirty,
		pushHistory,
		setPayloadField,
		shufflePalette,
		snapshotBrandPalette,
	} from '$lib/stores/editor.svelte';

	const payload = $derived(getPayload());

	// All color state reads directly from the reactive brand-palette store
	const primaryColor = $derived(palette.getPrimaryColor());
	const theme = $derived(palette.getTheme());
	const paletteStatus = $derived(palette.getPaletteStatus());
	const palettePresets = $derived(palette.getPresets());
	const brandTarget = $derived(palette.getBrandTarget());
	const brandColor = $derived(
		brandTarget === 'accent' ? theme.accentColor : primaryColor,
	);

	let logoPreview = $state<string | null>(null);
	let extractedHex = $state<string | null>(null);
	let extracting = $state(false);
	let dragOver = $state(false);

	/** Color setters — update the reactive store, then sync back to editor payload. */
	const COLOR_SETTERS: Record<string, (hex: string) => void> = {
		primaryColor: palette.setPrimaryColor,
		accentColor: palette.setManualAccent,
		secondaryColor: palette.setManualSecondary,
		backgroundColor: palette.setManualBackground,
		textColor: palette.setManualText,
	};

	function handleColorChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				COLOR_SETTERS[field]?.(target.value);
				snapshotBrandPalette();
				handleFieldChange(event.type === 'input');
			}
		};
	}

	function handleHarmonyChange(event: Event) {
		const target = event.target;
		if (target instanceof HTMLSelectElement) {
			palette.setHarmonyMode(target.value);
			snapshotBrandPalette();
			handleFieldChange(false);
		}
	}

	function handleLockChange(which: 'accent' | 'secondary') {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				if (which === 'accent') palette.setLockAccent(target.checked);
				else palette.setLockSecondary(target.checked);
				snapshotBrandPalette();
				pushHistory();
				markDirty();
			}
		};
	}

	function handlePresetClick(preset: PalettePresetSuggestion): void {
		palette.applyPreset(preset);
		snapshotBrandPalette();
		pushHistory();
		markDirty();
	}

	function handleTextInput(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				setPayloadField(field, target.value);
				handleFieldChange(event.type === 'input');
			}
		};
	}

	function handleLayoutPresetLock(event: Event) {
		const target = event.target;
		if (target instanceof HTMLInputElement) {
			setPayloadField('layoutPresetLock', target.checked);
			pushHistory();
			markDirty();
		}
	}

	function handleSelectChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLSelectElement) {
				setPayloadField(field, target.value);
				handleFieldChange(false);
			}
		};
	}

	async function processImageFile(file: File): Promise<void> {
		if (!file.type.startsWith('image/')) return;

		const url = URL.createObjectURL(file);
		logoPreview = url;
		extractedHex = null;
		extracting = true;

		try {
			const hex = await extractDominantColor(file);
			extractedHex = hex;
		} catch {
			extractedHex = null;
		} finally {
			extracting = false;
		}
	}

	function applyExtractedColor(): void {
		if (!extractedHex) return;
		palette.setBrandColor(extractedHex);
		snapshotBrandPalette();
		pushHistory();
		markDirty();
	}

	function handleLogoDrop(event: DragEvent): void {
		event.preventDefault();
		dragOver = false;
		const file = event.dataTransfer?.files[0];
		if (file) processImageFile(file);
	}

	function handleLogoInput(event: Event): void {
		const target = event.target;
		if (target instanceof HTMLInputElement) {
			const file = target.files?.[0];
			if (file) processImageFile(file);
		}
	}

	function clearLogo(): void {
		if (logoPreview) URL.revokeObjectURL(logoPreview);
		logoPreview = null;
		extractedHex = null;
		extracting = false;
	}
</script>

<details class="form-section" use:persistDetails={'brand-styling'}>
	<summary>Brand Styling</summary>

	<!-- Layout preset (unchanged) -->
	<div class="section-grid two-col">
		<div class="field">
			<label for="layoutPreset">Layout preset</label>
			<select
				id="layoutPreset"
				name="layoutPreset"
				value={String(payload.layoutPreset || 'notso-premium-v1')}
				class:is-locked={Boolean(payload.layoutPresetLock)}
				onchange={handleSelectChange('layoutPreset')}
			>
				<option value="notso-premium-v1">Notso Premium v1</option>
			</select>
		</div>
		<label class="slide-chip">
			<input
				id="layoutPresetLock"
				name="layoutPresetLock"
				type="checkbox"
				checked={Boolean(payload.layoutPresetLock)}
				onchange={handleLayoutPresetLock}
			>
			<span>Lock preset</span>
			<small>Keeps slide structure fixed for consistent pitch quality</small>
		</label>
	</div>

	<!-- ═══ Zone 1: Brand Input ═══ -->
	<div class="brand-input-zone">
		<div class="field color-field brand-color-field">
			<label for="brandColor">Brand color</label>
			<input
				id="brandColor"
				name="brandColor"
				type="color"
				value={brandColor}
				oninput={(e) => {
					const target = e.target;
					if (target instanceof HTMLInputElement) {
						palette.setBrandColor(target.value);
						snapshotBrandPalette();
						handleFieldChange(e.type === 'input');
					}
				}}
				onchange={(e) => {
					const target = e.target;
					if (target instanceof HTMLInputElement) {
						palette.setBrandColor(target.value);
						snapshotBrandPalette();
						handleFieldChange(false);
					}
				}}
			>
			<span class="color-hex">{brandColor}</span>
			<button
				type="button"
				class="ghost small brand-target-toggle"
				title={brandTarget === 'primary'
				? 'Brand color → Primary. Click to switch to Accent.'
				: 'Brand color → Accent. Click to switch to Primary.'}
				onclick={() => {
					palette.setBrandTarget(brandTarget === 'primary' ? 'accent' : 'primary');
					snapshotBrandPalette();
					pushHistory();
					markDirty();
				}}
			>
				→ {brandTarget === 'primary' ? 'Primary' : 'Accent'}
			</button>
		</div>

		<div
			class="logo-drop-zone"
			class:drag-over={dragOver}
			class:has-logo={logoPreview !== null}
			role="button"
			tabindex="0"
			ondragover={(e) => {
				e.preventDefault();
				dragOver = true;
			}}
			ondragleave={() => {
				dragOver = false;
			}}
			ondrop={handleLogoDrop}
			onclick={() => document.getElementById('logo-upload')?.click()}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					document.getElementById('logo-upload')?.click();
				}
			}}
		>
			<input
				id="logo-upload"
				type="file"
				accept="image/*"
				aria-label="Upload logo"
				class="sr-only"
				onchange={handleLogoInput}
			>
			{#if logoPreview}
				<img src={logoPreview} alt="Uploaded logo" class="logo-thumb">
				<div class="logo-extract-row">
					{#if extracting}
						<span class="extract-status">Extracting...</span>
					{:else if extractedHex}
						<span
							class="extracted-swatch"
							style:background={extractedHex}
						></span>
						<button
							type="button"
							class="ghost small"
							onclick={(e) => {
								e.stopPropagation();
								applyExtractedColor();
							}}
						>
							Use {extractedHex}
						</button>
						<button
							type="button"
							class="ghost small"
							onclick={(e) => {
								e.stopPropagation();
								clearLogo();
							}}
						>
							Clear
						</button>
					{/if}
				</div>
			{:else}
				<span class="drop-label"
				>Drop logo or click to extract brand color</span>
			{/if}
		</div>
	</div>

	<!-- ═══ Zone 2: Palette Suggestions ═══ -->
	<div class="preset-grid">
		{#each palettePresets as preset (preset.id)}
			<button
				type="button"
				class="preset-card"
				class:is-active={palette.isPresetActive(preset)}
				onclick={() => handlePresetClick(preset)}
			>
				<span class="preset-swatches" aria-hidden="true">
					<span
						class:brand-target={brandTarget === 'primary'}
						style:background={preset.theme.primaryColor}
					></span>
					<span
						class:brand-target={brandTarget === 'accent'}
						style:background={preset.theme.accentColor}
					></span>
					<span style:background={preset.theme.secondaryColor}></span>
					<span style:background={preset.theme.backgroundColor}></span>
					<span style:background={preset.theme.textColor}></span>
				</span>
				<span class="preset-label">{preset.label}</span>
			</button>
		{/each}
	</div>

	<!-- ═══ Active palette + shuffle ═══ -->
	<div class="active-palette-row">
		<div class="active-swatches" aria-label="Current palette">
			<span
				class:brand-target={brandTarget === 'primary'}
				style:background={primaryColor}
				title="Primary"
			></span>
			<span
				class:brand-target={brandTarget === 'accent'}
				style:background={theme.accentColor}
				title="Accent"
			></span>
			<span style:background={theme.secondaryColor} title="Dark slide"></span>
			<span style:background={theme.backgroundColor} title="Background"></span>
			<span style:background={theme.textColor} title="Text"></span>
		</div>
		<button type="button" class="ghost small" onclick={shufflePalette}>
			Shuffle
		</button>
	</div>

	<!-- ═══ Zone 3: Advanced (collapsed) ═══ -->
	<details class="advanced-section" use:persistDetails={'brand-advanced'}>
		<summary class="advanced-toggle">Fine-tune colors & typography</summary>

		<p
			class="status palette-status"
			class:warning={paletteStatus.tone === 'warning'}
		>
			{paletteStatus.text}
		</p>

		<div class="section-grid five-col">
			<div
				class="field color-field palette-field"
				class:brand-target-field={brandTarget === 'primary'}
			>
				<label for="adv-primaryColor">Primary</label>
				<input
					id="adv-primaryColor"
					name="primaryColor"
					type="color"
					value={primaryColor}
					oninput={handleColorChange('primaryColor')}
					onchange={handleColorChange('primaryColor')}
				>
			</div>
			<div
				class="field color-field palette-field"
				class:brand-target-field={brandTarget === 'accent'}
			>
				<label for="adv-accentColor">Accent</label>
				<input
					id="adv-accentColor"
					name="accentColor"
					type="color"
					value={theme.accentColor}
					disabled={!palette.getLockAccent()}
					oninput={handleColorChange('accentColor')}
					onchange={handleColorChange('accentColor')}
				>
			</div>
			<div class="field color-field palette-field">
				<label for="adv-secondaryColor">Dark slide</label>
				<input
					id="adv-secondaryColor"
					name="secondaryColor"
					type="color"
					value={theme.secondaryColor}
					disabled={!palette.getLockSecondary()}
					oninput={handleColorChange('secondaryColor')}
					onchange={handleColorChange('secondaryColor')}
				>
			</div>
			<div class="field color-field palette-field">
				<label for="adv-backgroundColor">Background</label>
				<input
					id="adv-backgroundColor"
					name="backgroundColor"
					type="color"
					value={theme.backgroundColor}
					oninput={handleColorChange('backgroundColor')}
					onchange={handleColorChange('backgroundColor')}
				>
			</div>
			<div class="field color-field palette-field">
				<label for="adv-textColor">Text</label>
				<input
					id="adv-textColor"
					name="textColor"
					type="color"
					value={theme.textColor}
					oninput={handleColorChange('textColor')}
					onchange={handleColorChange('textColor')}
				>
			</div>
		</div>

		<div class="palette-toolbar">
			<input
				name="paletteShuffleSeed"
				type="hidden"
				value={String(palette.getShuffleSeed())}
			>
			<div class="field toolbar-field">
				<label for="harmonyMode">Harmony</label>
				<select
					id="harmonyMode"
					name="harmonyMode"
					value={palette.getHarmonyMode()}
					onchange={handleHarmonyChange}
				>
					{#each HARMONY_MODES as mode (mode)}
						<option value={mode}>
							{mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
						</option>
					{/each}
				</select>
			</div>
			<label class="palette-lock" for="lock-accentColor">
				<input
					id="lock-accentColor"
					name="lockAccentColor"
					type="checkbox"
					checked={palette.getLockAccent()}
					onchange={handleLockChange('accent')}
				>
				<span>Lock accent</span>
			</label>
			<label class="palette-lock" for="lock-secondaryColor">
				<input
					id="lock-secondaryColor"
					name="lockSecondaryColor"
					type="checkbox"
					checked={palette.getLockSecondary()}
					onchange={handleLockChange('secondary')}
				>
				<span>Lock dark</span>
			</label>
		</div>

		<div class="section-grid two-col" style="margin-top: 12px">
			<div class="field">
				<label for="headingFont">Heading font</label>
				<input
					id="headingFont"
					name="headingFont"
					value={String(payload.headingFont || 'Sora')}
					oninput={handleTextInput('headingFont')}
					onchange={handleTextInput('headingFont')}
				>
			</div>
			<div class="field">
				<label for="bodyFont">Body font</label>
				<input
					id="bodyFont"
					name="bodyFont"
					value={String(payload.bodyFont || 'Inter')}
					oninput={handleTextInput('bodyFont')}
					onchange={handleTextInput('bodyFont')}
				>
			</div>
		</div>
	</details>
</details>

<style>
	/* ── Zone 1: Brand Input ── */
	.brand-input-zone {
		margin-top: 12px;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 12px;
		align-items: start;
	}

	.brand-color-field {
		gap: 6px;
	}

	.brand-color-field input[type="color"] {
		width: 60px;
		height: 60px;
		padding: 2px;
		border-radius: 12px;
		cursor: pointer;
	}

	.color-hex {
		font-size: 0.74rem;
		font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
		color: #506791;
		text-align: center;
	}

	/* ── Logo drop zone ── */
	.logo-drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 80px;
		border: 2px dashed rgba(126, 151, 205, 0.42);
		border-radius: 12px;
		padding: 12px;
		background: #f8fbff;
		cursor: pointer;
		transition: border-color 0.16s, background 0.16s;
	}

	.logo-drop-zone:hover,
	.logo-drop-zone.drag-over {
		border-color: #2e77e8;
		background: #eef4ff;
	}

	.logo-drop-zone.has-logo {
		flex-direction: row;
		justify-content: flex-start;
		gap: 12px;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.drop-label {
		font-size: 0.82rem;
		color: #506791;
		font-weight: 600;
	}

	.logo-thumb {
		width: 48px;
		height: 48px;
		object-fit: contain;
		border-radius: 8px;
		background: #fff;
		border: 1px solid rgba(126, 151, 205, 0.25);
	}

	.logo-extract-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.extract-status {
		font-size: 0.78rem;
		color: #506791;
		font-weight: 600;
	}

	.extracted-swatch {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		border: 2px solid #fff;
		box-shadow: 0 0 0 1px rgba(11, 28, 44, 0.12);
		flex-shrink: 0;
	}

	/* ── Zone 2: Palette Suggestions ── */
	.preset-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		margin-top: 14px;
	}

	.preset-card {
		display: grid;
		gap: 8px;
		align-content: start;
		text-align: center;
		border: 2px solid rgba(126, 151, 205, 0.3);
		border-radius: 12px;
		padding: 10px 8px 8px;
		background: linear-gradient(180deg, #ffffff, #f4f8ff);
		color: #183968;
		cursor: pointer;
		transition: border-color 0.16s, box-shadow 0.16s;
	}

	.preset-card:hover {
		border-color: #8aa8e9;
	}

	.preset-card.is-active {
		border-color: #2e77e8;
		box-shadow: 0 0 0 3px rgba(46, 119, 232, 0.15);
	}

	.preset-swatches {
		display: grid;
		grid-template-columns: 1fr;
		gap: 3px;
	}

	.preset-swatches span {
		height: 18px;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.72);
		box-shadow: inset 0 0 0 1px rgba(11, 28, 44, 0.06);
		transition: box-shadow 0.16s;
	}

	.preset-swatches span.brand-target {
		box-shadow: inset 0 0 0 1px rgba(11, 28, 44, 0.06), 0 0 0 2px #2e77e8;
	}

	.preset-label {
		font-size: 0.76rem;
		font-weight: 700;
	}

	/* ── Active palette strip ── */
	.active-palette-row {
		margin-top: 10px;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.active-swatches {
		display: flex;
		flex: 1;
		gap: 3px;
		height: 28px;
	}

	.active-swatches span {
		flex: 1;
		border-radius: 5px;
		border: 1px solid rgba(255, 255, 255, 0.72);
		box-shadow: inset 0 0 0 1px rgba(11, 28, 44, 0.08);
		transition: background 0.2s, box-shadow 0.16s;
	}

	.active-swatches span.brand-target {
		box-shadow: inset 0 0 0 1px rgba(11, 28, 44, 0.08), 0 0 0 2px #2e77e8;
	}

	/* ── Zone 3: Advanced ── */
	.brand-target-field label {
		color: #2e77e8;
	}

	.brand-target-field input[type="color"] {
		box-shadow: 0 0 0 2px #2e77e8;
	}

	.advanced-section {
		margin-top: 14px;
		border: 1px solid rgba(173, 196, 238, 0.3);
		border-radius: 10px;
		padding: 8px 10px;
		background: rgba(248, 252, 255, 0.6);
	}

	.advanced-toggle {
		list-style: none;
		cursor: pointer;
		font-size: 0.82rem;
		font-weight: 700;
		color: #44608f;
	}

	.advanced-toggle::-webkit-details-marker {
		display: none;
	}

	.advanced-toggle::after {
		content: " +";
		color: #7a9ad4;
	}

	.advanced-section[open] > .advanced-toggle::after {
		content: " \2212";
	}

	.palette-status {
		margin: 8px 0 6px;
		font-size: 0.78rem;
	}

	.palette-toolbar {
		margin-top: 10px;
		display: flex;
		flex-wrap: wrap;
		align-items: end;
		gap: 10px;
	}

	.toolbar-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.toolbar-field label {
		font-size: 0.74rem;
		color: #44608f;
		font-weight: 700;
	}

	.toolbar-field select {
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
		color: var(--text);
		font: inherit;
		font-size: 0.82rem;
		padding: 6px 8px;
	}

	:global(.palette-field) {
		gap: 4px;
	}

	.palette-lock {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #44608f;
		font-size: 0.76rem;
		font-weight: 700;
	}

	.palette-lock input {
		width: auto;
		margin: 0;
		accent-color: var(--secondary);
	}

	@media (max-width: 900px) {
		.preset-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 600px) {
		.brand-input-zone {
			grid-template-columns: 1fr;
		}

		.brand-color-field {
			flex-direction: row;
			align-items: center;
		}

		.brand-color-field input[type="color"] {
			width: 44px;
			height: 44px;
		}
	}
</style>

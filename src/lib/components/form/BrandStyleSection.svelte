<script lang="ts">
	import {
		DEFAULT_THEME_COLORS,
		HARMONY_MODES,
		normalizeHexColor,
	} from '$lib/color-palette';
	import {
		getPaletteStatus,
		getPayload,
		handleFieldChange,
		markDirty,
		pushHistory,
		setPayloadField,
		shufflePalette,
		syncBrandPalette,
	} from '$lib/stores/editor.svelte';

	const payload = $derived(getPayload());
	const paletteStatus = $derived(getPaletteStatus());
	const primaryColor = $derived(
		normalizeHexColor(payload.primaryColor, DEFAULT_THEME_COLORS.primaryColor),
	);
	const accentColor = $derived(
		normalizeHexColor(payload.accentColor, DEFAULT_THEME_COLORS.accentColor),
	);
	const secondaryColor = $derived(
		normalizeHexColor(
			payload.secondaryColor,
			DEFAULT_THEME_COLORS.secondaryColor,
		),
	);
	const backgroundColor = $derived(
		normalizeHexColor(
			payload.backgroundColor,
			DEFAULT_THEME_COLORS.backgroundColor,
		),
	);
	const textColor = $derived(
		normalizeHexColor(payload.textColor, DEFAULT_THEME_COLORS.textColor),
	);

	function handleColorChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				const fallback = field === 'primaryColor'
					? DEFAULT_THEME_COLORS.primaryColor
					: field === 'accentColor'
					? DEFAULT_THEME_COLORS.accentColor
					: field === 'secondaryColor'
					? DEFAULT_THEME_COLORS.secondaryColor
					: field === 'backgroundColor'
					? DEFAULT_THEME_COLORS.backgroundColor
					: DEFAULT_THEME_COLORS.textColor;
				setPayloadField(field, normalizeHexColor(target.value, fallback));
				syncBrandPalette();
				handleFieldChange(event.type === 'input');
			}
		};
	}

	function handleSelectChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLSelectElement) {
				setPayloadField(field, target.value);
				if (field === 'harmonyMode') syncBrandPalette();
				handleFieldChange(false);
			}
		};
	}

	function handleCheckboxChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				setPayloadField(field, target.checked);
				if (field === 'lockAccentColor' || field === 'lockSecondaryColor') {
					syncBrandPalette();
				}
				pushHistory();
				markDirty();
			}
		};
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
</script>

<details class="form-section">
	<summary>Brand Styling</summary>
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
	<div class="section-grid two-col brand-palette-tools">
		<div class="field color-field">
			<label for="primaryColor">Brand primary color</label>
			<input
				id="primaryColor"
				name="primaryColor"
				type="color"
				value={primaryColor}
				oninput={handleColorChange('primaryColor')}
				onchange={handleColorChange('primaryColor')}
			>
		</div>
		<div class="field">
			<label for="harmonyMode">Harmony mode</label>
			<select
				id="harmonyMode"
				name="harmonyMode"
				value={String(payload.harmonyMode || 'complementary')}
				onchange={handleSelectChange('harmonyMode')}
			>
				{#each HARMONY_MODES as mode (mode)}
					<option value={mode}>
						{mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ')}
					</option>
				{/each}
			</select>
		</div>
	</div>
	<div class="palette-toolbar">
		<input
			name="paletteShuffleSeed"
			type="hidden"
			value={String(payload.paletteShuffleSeed || '0')}
		>
		<button type="button" class="ghost small" onclick={shufflePalette}>
			Shuffle colors
		</button>
		<label class="palette-lock" for="lock-accentColor">
			<input
				id="lock-accentColor"
				name="lockAccentColor"
				type="checkbox"
				checked={Boolean(payload.lockAccentColor)}
				onchange={handleCheckboxChange('lockAccentColor')}
			>
			<span>Lock color 2</span>
		</label>
		<label class="palette-lock" for="lock-secondaryColor">
			<input
				id="lock-secondaryColor"
				name="lockSecondaryColor"
				type="checkbox"
				checked={Boolean(payload.lockSecondaryColor)}
				onchange={handleCheckboxChange('lockSecondaryColor')}
			>
			<span>Lock color 3 (dark)</span>
		</label>
	</div>
	<p
		class="status palette-status"
		class:warning={paletteStatus.tone === 'warning'}
	>
		{paletteStatus.text}
	</p>
	<div class="section-grid five-col">
		<div class="field color-field palette-field">
			<label for="accentColor">Color 2</label>
			<input
				id="accentColor"
				name="accentColor"
				type="color"
				value={accentColor}
				disabled={!payload.lockAccentColor}
				oninput={handleColorChange('accentColor')}
				onchange={handleColorChange('accentColor')}
			>
		</div>
		<div class="field color-field palette-field">
			<label for="secondaryColor">Color 3 (dark slide)</label>
			<input
				id="secondaryColor"
				name="secondaryColor"
				type="color"
				value={secondaryColor}
				disabled={!payload.lockSecondaryColor}
				oninput={handleColorChange('secondaryColor')}
				onchange={handleColorChange('secondaryColor')}
			>
		</div>
		<div class="field color-field palette-field">
			<label for="backgroundColor">Deck background</label>
			<input
				id="backgroundColor"
				name="backgroundColor"
				type="color"
				value={backgroundColor}
				oninput={handleColorChange('backgroundColor')}
				onchange={handleColorChange('backgroundColor')}
			>
		</div>
		<div class="field color-field palette-field">
			<label for="textColor">Deck text</label>
			<input
				id="textColor"
				name="textColor"
				type="color"
				value={textColor}
				oninput={handleColorChange('textColor')}
				onchange={handleColorChange('textColor')}
			>
		</div>
		<div class="field">
			<label for="headingFont">Deck heading font</label>
			<input
				id="headingFont"
				name="headingFont"
				value={String(payload.headingFont || 'Sora')}
				oninput={handleTextInput('headingFont')}
				onchange={handleTextInput('headingFont')}
			>
		</div>
		<div class="field">
			<label for="bodyFont">Deck body font</label>
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

<style>
	.brand-palette-tools {
		margin-top: 10px;
	}

	.palette-toolbar {
		margin-top: 8px;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
	}

	.palette-status {
		margin: 8px 0 2px;
		font-size: 0.82rem;
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
</style>

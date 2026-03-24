<script lang="ts">
	import { HARMONY_MODES } from '$lib/color-palette.ts';
	import {
		getPaletteStatus,
		getPayload,
		handleFieldChange,
		markDirty,
		pushHistory,
		setPayloadField,
		shufflePalette,
		syncBrandPalette,
	} from '$lib/stores/editor.svelte.ts';

	const payload = $derived(getPayload());
	const paletteStatus = $derived(getPaletteStatus());

	function handleColorChange(field: string) {
		return (event: Event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement) {
				setPayloadField(field, target.value);
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
				value={String(payload.primaryColor || '#004B49')}
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
				value={String(payload.accentColor || '#30D89E')}
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
				value={String(payload.secondaryColor || '#0B6E6C')}
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
				value={String(payload.backgroundColor || '#F2F4F6')}
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
				value={String(payload.textColor || '#0B1D2E')}
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

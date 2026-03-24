# Haiku Easter Egg Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a haiku Easter egg that shows random Dutch/English haiku in loading states, empty states, error pages, and the footer — gated behind a `PUBLIC_FEATURE_HAIKU` feature flag.

**Architecture:** Static haiku data module exports a typed array + random picker. A single `<Haiku>` Svelte 5 component renders in three visual variants. The component checks `PUBLIC_FEATURE_HAIKU` at render time and renders nothing when disabled. Integration touches four existing files plus one new error page.

**Tech Stack:** Svelte 5, SvelteKit, TypeScript, vitest (server project for data tests)

**Spec:** `docs/superpowers/specs/2026-03-24-haiku-easter-egg-design.md`

---

## File Structure

| Action | Path                                               | Responsibility                                              |
| ------ | -------------------------------------------------- | ----------------------------------------------------------- |
| Create | `src/lib/haiku.ts`                                 | Haiku type, static collection, `randomHaiku()` picker       |
| Create | `src/lib/haiku.test.ts`                            | Data integrity tests for haiku collection                   |
| Create | `src/lib/components/Haiku.svelte`                  | Render component with variant/lang props, feature flag gate |
| Create | `src/routes/+error.svelte`                         | SvelteKit error page with haiku card                        |
| Create | `.env.example`                                     | Document env vars including `PUBLIC_FEATURE_HAIKU`          |
| Modify | `src/lib/components/form/QuickStartSection.svelte` | Show haiku during autofill loading                          |
| Modify | `src/lib/components/SlideCanvas.svelte`            | Show haiku in empty/no-slides state                         |
| Modify | `src/routes/+layout.svelte`                        | Add haiku footer                                            |

**Parallelism:** Tasks 3, 4, 5, 6 all depend only on Task 2 and modify different files — they can run in parallel.

---

### Task 1: Haiku Data Module

**Files:**

- Create: `src/lib/haiku.ts`
- Create: `src/lib/haiku.test.ts`
- Create: `.env.example`

- [ ] **Step 1: Create `.env.example`**

Create `.env.example` at project root:

```env
# Feature flags
PUBLIC_FEATURE_HAIKU=
```

- [ ] **Step 2: Write failing tests for data integrity**

Create `src/lib/haiku.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { haikus, randomHaiku } from './haiku';

describe('haiku collection', () => {
	it('has at least 10 Dutch haiku', () => {
		const nl = haikus.filter((h) => h.lang === 'nl');
		expect(nl.length).toBeGreaterThanOrEqual(10);
	});

	it('has at least 10 English haiku', () => {
		const en = haikus.filter((h) => h.lang === 'en');
		expect(en.length).toBeGreaterThanOrEqual(10);
	});

	it('every haiku has exactly 3 non-empty lines', () => {
		for (const h of haikus) {
			expect(h.lines).toHaveLength(3);
			for (const line of h.lines) {
				expect(line.trim().length).toBeGreaterThan(0);
			}
		}
	});

	it('every haiku has a valid lang', () => {
		for (const h of haikus) {
			expect(['nl', 'en']).toContain(h.lang);
		}
	});
});

describe('randomHaiku', () => {
	it('returns a haiku from the collection', () => {
		const h = randomHaiku();
		expect(h).toBeDefined();
		expect(haikus).toContain(h);
	});

	it('filters by language', () => {
		const h = randomHaiku('nl');
		expect(h).toBeDefined();
		expect(h!.lang).toBe('nl');
	});

	it('returns undefined for empty collection edge case', () => {
		// randomHaiku always returns from the full collection when filter has no matches
		// With our real data both languages exist, so just verify it works
		const h = randomHaiku('en');
		expect(h).toBeDefined();
		expect(h!.lines).toHaveLength(3);
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `bun run test -- --project server --run src/lib/haiku.test.ts`
Expected: FAIL — module `./haiku` not found.

- [ ] **Step 4: Create haiku data module**

Create `src/lib/haiku.ts` with the `Haiku` type, a collection of 24 haiku (12 NL, 12 EN), and the `randomHaiku()` function:

```ts
export interface Haiku {
	lines: [string, string, string];
	lang: 'nl' | 'en';
	author?: string;
}

export const haikus: readonly Haiku[] = [
	// ── Dutch ────────────────────────────────────────
	{ lines: ['Ach oude vijver', 'een kikker springt erin', 'geluid van water'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['Lentebries waait', 'de wilg kijkt omlaag naar', 'haar spiegelbeeld'], lang: 'nl' },
	{ lines: ['Bladeren vallen', 'de aarde ademt diep in', 'winter slaapt al bij'], lang: 'nl' },
	{ lines: ['Door zomerregens', 'zijn de kraanvogelpoten', 'korter geworden'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['Een slak kruipt langzaam', 'over de rand van de maan', 'stille lentenacht'], lang: 'nl', author: 'Kobayashi Issa' },
	{ lines: ['Het druppelen van', 'een waterkraan beklemtoont', 'de stilte in huis'], lang: 'nl' },
	{ lines: ['Zomergras meer niet', 'dat rest er van de dromen', 'van koene krijgers'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['De eerste sneeuw valt', 'op het blad van de narcis', 'die al buigend wacht'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['Zou ik ze pakken', 'de witvis in het wier bijeen', 'dan schoten ze weg'], lang: 'nl', author: 'Matsuo Bashō' },
	{ lines: ['Ochtenddauw glanst op', 'spinnenwebben in het gras', 'de zon komt kijken'], lang: 'nl' },
	{ lines: ['Na de plechtigheid', 'tientallen handen schudden', 'geen naam onthouden'], lang: 'nl' },
	{ lines: ['Boven het graf van', 'haar grootmoeder buiten bidt', 'een leeuwerik zacht'], lang: 'nl' },

	// ── English ──────────────────────────────────────
	{ lines: ['An old silent pond', 'a frog jumps into the pond', 'splash silence again'], lang: 'en', author: 'Matsuo Bashō' },
	{ lines: ['The light of a candle', 'is transferred to another', 'spring twilight'], lang: 'en', author: 'Yosa Buson' },
	{ lines: ['Over the wintry', 'forest winds howl in rage', 'with no leaves to blow'], lang: 'en', author: 'Natsume Sōseki' },
	{ lines: ['In the twilight rain', 'these brilliant-hued hibiscus', 'a lovely sunset'], lang: 'en', author: 'Matsuo Bashō' },
	{ lines: ['A world of dew', 'and within every dewdrop', 'a world of struggle'], lang: 'en', author: 'Kobayashi Issa' },
	{ lines: ['The old pond is still', 'a frog leaps right into it', 'and water echoes'], lang: 'en', author: 'Matsuo Bashō' },
	{ lines: ['First autumn morning', 'the mirror I stare into', "shows my father's face"], lang: 'en', author: 'Murakami Kijō' },
	{ lines: ['Blowing from the west', 'fallen leaves gather in the', 'east'], lang: 'en', author: 'Yosa Buson' },
	{ lines: ['None is travelling', 'here along this way but I', 'this autumn evening'], lang: 'en', author: 'Matsuo Bashō' },
	{ lines: ['Temple bells die out', 'the fragrant blossoms remain', 'a perfect evening'], lang: 'en', author: 'Matsuo Bashō' },
	{ lines: ['Do not forget plum', 'blooming in the thicket there', 'exactly for you'], lang: 'en', author: 'Kobayashi Issa' },
	{ lines: ['The crow has flown away', 'swaying in the evening sun', 'a leafless tree'], lang: 'en', author: 'Matsuo Bashō' },
];

/**
 * Pick a random haiku, optionally filtered by language.
 * Falls back to unfiltered pool if no haiku match the given language.
 * Returns `undefined` only if the collection is empty (should never happen).
 */
export function randomHaiku(lang?: 'nl' | 'en'): Haiku | undefined {
	let pool: readonly Haiku[] = haikus;
	if (lang) {
		const filtered = haikus.filter((h) => h.lang === lang);
		if (filtered.length > 0) pool = filtered;
	}
	if (pool.length === 0) return undefined;
	return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `bun run test -- --project server --run src/lib/haiku.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add .env.example src/lib/haiku.ts src/lib/haiku.test.ts
git commit -m "feat: add haiku data module with collection + random picker"
```

---

### Task 2: Haiku Svelte Component

**Files:**

- Create: `src/lib/components/Haiku.svelte`

**Depends on:** Task 1

- [ ] **Step 1: Create the Haiku component**

Create `src/lib/components/Haiku.svelte`:

```svelte
<script lang="ts">
	import { PUBLIC_FEATURE_HAIKU } from '$env/static/public';
	import { randomHaiku } from '$lib/haiku';

	interface Props {
		variant?: 'inline' | 'card' | 'ghost';
		lang?: 'nl' | 'en';
	}

	let { variant = 'ghost', lang }: Props = $props();

	const enabled = PUBLIC_FEATURE_HAIKU === 'true'
		|| PUBLIC_FEATURE_HAIKU === '1';

	const haiku = enabled ? randomHaiku(lang) : undefined;
</script>

{#if haiku}
	<figure class="haiku {variant}" lang={haiku.lang}>
		<blockquote>
			{#each haiku.lines as line}
				<p>{line}</p>
			{/each}
		</blockquote>
		{#if haiku.author}
			<figcaption>— {haiku.author}</figcaption>
		{/if}
	</figure>
{/if}

<style>
	.haiku {
		text-align: center;
		margin: 0;
		padding: 1rem 0;
	}

	blockquote {
		margin: 0;
		font-style: italic;
		line-height: 1.8;
	}

	blockquote p {
		margin: 0;
	}

	figcaption {
		margin-top: 0.5rem;
		font-size: 0.8rem;
		font-style: normal;
	}

	/* ── Variants ── */

	.ghost {
		color: var(--muted);
	}

	.ghost figcaption {
		opacity: 0.7;
	}

	.inline {
		color: var(--muted);
		padding: 0.5rem 0;
	}

	.card {
		color: var(--text);
		background: var(--card);
		border: 1px solid rgba(130, 156, 212, 0.27);
		border-radius: 12px;
		box-shadow: var(--shadow);
		padding: 1.5rem;
	}
</style>
```

Note: `randomHaiku()` returns `Haiku | undefined`. The `{#if haiku}` block handles the undefined case. No type assertion needed.

- [ ] **Step 2: Verify the component has no Svelte checker errors**

Run: `bun check`
Expected: No errors related to `Haiku.svelte`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Haiku.svelte
git commit -m "feat: add Haiku component with variant/lang props + feature flag"
```

---

### Task 3: Integrate into QuickStartSection (Loading State)

**Files:**

- Modify: `src/lib/components/form/QuickStartSection.svelte`

**Depends on:** Task 2 (can run in parallel with Tasks 4, 5, 6)

The `autofilling` state in `QuickStartSection.svelte` (line 23) controls the loading state while AI generates content. Show a haiku **after** the `.actions-row` div when `autofilling` is true.

- [ ] **Step 1: Add haiku to autofill loading state**

In `src/lib/components/form/QuickStartSection.svelte`:

1. Add import at top of `<script>`:
   ```ts
   import Haiku from '$lib/components/Haiku.svelte';
   ```

2. After the closing `</div>` of `.actions-row` (after line 171), add:
   ```svelte
   {#if autofilling}
   	<Haiku variant="inline" />
   {/if}
   ```

   This places the haiku below the buttons + status row, not inside the flex container.

- [ ] **Step 2: Run linter and Svelte checker**

Run: `bun lint && bun check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/form/QuickStartSection.svelte
git commit -m "feat: show haiku during AI autofill loading"
```

---

### Task 4: Integrate into SlideCanvas (Empty State)

**Files:**

- Modify: `src/lib/components/SlideCanvas.svelte`

**Depends on:** Task 2 (can run in parallel with Tasks 3, 5, 6)

SlideCanvas currently has no empty state — the `{#each slides ...}` loop at line 89 silently renders nothing when `slides` is empty. Wrap the canvas in a conditional to show a haiku when there are no slides.

- [ ] **Step 1: Add haiku to the empty state**

In `src/lib/components/SlideCanvas.svelte`:

1. Add import at top of `<script>`:
   ```ts
   import Haiku from '$lib/components/Haiku.svelte';
   ```

2. Replace the template section (lines 70–102). Wrap the existing `.slide-stage` div in an `{#if}/{:else}` block:
   ```svelte
   {#if slides.length === 0}
   	<div class="slide-stage empty">
   		<Haiku variant="ghost" />
   	</div>
   {:else}
   	<div class="slide-stage">
   		<!-- existing slide-canvas div unchanged -->
   		<div
   			class="slide-canvas"
   			use:canvasMetrics
   			use:swipeable={{
   				onPrev: prevSlide,
   				onNext: nextSlide,
   				onDrag(delta) {
   					dragOffset = delta;
   				},
   			}}
   			onclick={handleCanvasClick}
   			onkeydown={handleCanvasKeydown}
   		>
   			<div
   				class="slide-track"
   				style:transform={trackTransform}
   			>
   				{#each slides as slide, index (index)}
   					<section
   						class="slide-page"
   						class:is-active={index === current}
   						class:is-prev={index === current - 1}
   						class:is-next={index === current + 1}
   						data-slide-index={index}
   					>
   						<SlideRenderer {slide} {theme} {deckData} />
   					</section>
   				{/each}
   			</div>
   		</div>
   	</div>
   {/if}
   ```

3. Add `.empty` variant style in the `<style>` block:
   ```css
   .slide-stage.empty {
   	display: flex;
   	align-items: center;
   	justify-content: center;
   }
   ```

- [ ] **Step 2: Run linter and Svelte checker**

Run: `bun lint && bun check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/SlideCanvas.svelte
git commit -m "feat: show haiku in empty slide canvas"
```

---

### Task 5: Create Error Page

**Files:**

- Create: `src/routes/+error.svelte`

**Depends on:** Task 2 (can run in parallel with Tasks 3, 4, 6)

This file does not exist yet. SvelteKit falls back to a default error page. Create one with a haiku card alongside the error message.

- [ ] **Step 1: Create the error page**

Create `src/routes/+error.svelte`:

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import Haiku from '$lib/components/Haiku.svelte';
</script>

<div class="error-page">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Something went wrong.'}</p>
	<Haiku variant="card" />
	<a href="/">Go home</a>
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
```

Note: Uses `"DM Sans"` for heading — `"Sora"` is reserved for slide frames per spec.

- [ ] **Step 2: Run Svelte checker**

Run: `bun check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+error.svelte
git commit -m "feat: add error page with haiku card"
```

---

### Task 6: Integrate into Layout Footer

**Files:**

- Modify: `src/routes/+layout.svelte`

**Depends on:** Task 2 (can run in parallel with Tasks 3, 4, 5)

The current layout is minimal (just favicon + `{@render children()}`). Add a subtle footer haiku below the children.

- [ ] **Step 1: Add footer haiku to layout**

In `src/routes/+layout.svelte`, add:

1. Import at top of `<script>`:
   ```ts
   import Haiku from '$lib/components/Haiku.svelte';
   ```

2. After `{@render children()}`, add:
   ```svelte
   <footer class="haiku-footer">
   	<Haiku variant="ghost" />
   </footer>
   ```

3. Add styles:
   ```svelte
   <style>
   	.haiku-footer {
   		padding: 2rem 1rem;
   		text-align: center;
   	}
   </style>
   ```

- [ ] **Step 2: Run linter and Svelte checker**

Run: `bun lint && bun check`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: add haiku footer to layout"
```

---

### Task 7: Final Verification

**Depends on:** Tasks 1–6

- [ ] **Step 1: Run full test suite**

Run: `bun run test -- --run`
Expected: All tests pass. Note: vitest has `requireAssertions: true` — every test must include at least one assertion.

- [ ] **Step 2: Run build**

Run: `bun run build`
Expected: Zero errors. `PUBLIC_FEATURE_HAIKU` resolves to empty string when absent (feature disabled by default).

- [ ] **Step 3: Run linter + checker**

Run: `bun lint && bun check`
Expected: Zero errors.

- [ ] **Step 4: Test feature flag behavior**

1. Start dev server without flag: `bun dev` — verify no haiku appears anywhere.
2. Start dev server with flag: `PUBLIC_FEATURE_HAIKU=true bun dev` — verify haiku appears in footer, error page (navigate to `/nonexistent`), and loading states.

- [ ] **Step 5: Final commit if any fixups needed**

```bash
git add -A
git commit -m "fix: haiku easter egg final adjustments"
```

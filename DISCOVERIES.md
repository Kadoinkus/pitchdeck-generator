# Discoveries

Learnings, gotchas, and decisions encountered during development. Organized by domain.

---

## SvelteKit Remote Functions

**Status:** Experimental (as of SvelteKit 2.55)

### Requirements

- Files **must** use `.remote.ts` / `.remote.js` extension — SvelteKit uses this to identify modules needing client-side proxy transformation.
- **Must** opt in via `kit.experimental.remoteFunctions: true` in `svelte.config.ts`.
- Without both, `query()`/`command()` calls compile but produce no fetch proxies at runtime.

### Placement Rules

- Can live anywhere in `src/` **except** `src/lib/server/`.
- `$lib/server/` blocks all client imports — remote functions are imported by client components, so they fail the guard even though server code is stripped at build time.
- **Transitive deps matter:** if a remote function imports a module that imports `$lib/server/*` or `node:fs`, the entire chain is blocked. Functions with deep server-only deps (filesystem, `$lib/server/storage`) cannot be remote functions.

### Adopted Pattern

| File                  | Contains                         | Consumers                                      |
| --------------------- | -------------------------------- | ---------------------------------------------- |
| `$lib/data.remote.ts` | `query()` — templates, providers | `+page.svelte`                                 |
| `$lib/ai.remote.ts`   | `command()` — chat, autofill     | `ChatPanel.svelte`, `QuickStartSection.svelte` |

`generate` stays as `+server.ts` route — imports `$lib/server/storage`, `node:fs/promises`, `$lib/share-store`.

### Validation

- `'unchecked'` skips schema validation (acceptable when old routes had none either).
- Idiomatic approach: pass a Standard Schema (Zod, Valibot) as first arg for input validation on the exposed HTTP endpoint.

---

## SvelteKit `$app/types`

### `Pathname` vs `ResolvedPathname`

- `Pathname` — route paths without base path prefix (`/share/abc`).
- `ResolvedPathname` — possibly base-path-prefixed (`/base/share/abc`).
- `resolve()` from `$app/paths` returns `ResolvedPathname`.
- `page.url.pathname` is a `ResolvedPathname`.
- When accepting output from `resolve()`, type the parameter as `ResolvedPathname`.

---

## SvelteKit Environment Variables

### `$env/static/public` vs `$env/dynamic/public`

- `$env/static/public` — **requires** the variable to exist at build time. Build fails if missing.
- `$env/dynamic/public` — reads at runtime, returns `undefined` if absent.
- **Use dynamic for feature flags** that may not be set in all environments (local dev, CI, preview deploys).

**Example fix:** `PUBLIC_FEATURE_HAIKU` was breaking builds because no `.env` file existed. Switched from `$env/static/public` → `$env/dynamic/public` so the feature gracefully disables when unset.

---

## Serverless Architecture (Vercel)

### No Health Endpoints

A `/api/health` route is pointless on serverless — each invocation is a fresh function with no persistent process to healthcheck. Removed.

### Dead Route Hygiene

Unused API routes (`/api/editable-fields`, `/api/preview`) had zero callers (only referenced in README). Deleted rather than migrated.

---

## Slide Rendering & Container Queries

### The Zoom + CQI Double-Scaling Problem

**Symptom:** Text sizes inside slides changed unpredictably at different viewport zoom levels. Cards overflowed vertically at some zoom levels but not others.

**Root cause:** The slide system uses CSS `zoom` to scale a fixed-size slide (1020×574px) to fit the viewport. Text sizes used `clamp(Xpx, Ycqi, Zpx)` where `cqi` (container query inline-size) referenced the *parent* `.slide-render` wrapper, not the zoomed `.deck-slide`.

This created double-scaling:

- `zoom` scaled the entire slide based on viewport
- `cqi` values also scaled based on viewport (since they referenced the wrapper)
- The px min/max bounds in `clamp()` did NOT scale

At large viewport: `cqi` large + zoom large → text hit max px bound early
At small viewport: `cqi` small + zoom small → text hit min px bound early

Result: text appeared to jump between sizes instead of scaling smoothly.

**Fix:** Add `container-type: inline-size` to `.deck-slide` itself. Now `cqi` units reference the fixed 1020px slide width (so `1cqi` = 10.2px always), and `zoom` handles all viewport scaling uniformly. The px clamps become irrelevant since the `cqi` value is constant.

```css
.deck-slide {
	width: var(--ref-w); /* 1020px */
	height: var(--ref-h);
	zoom: calc(100cqi / var(--ref-w));
	container-type: inline-size; /* ← the fix */
}
```

### Pointer Events on Stretched Grid Children

**Symptom:** Empty space in text panels blocked drag/wheel events on the slide canvas.

**Root cause:** Grid children with `align-items: stretch` fill their entire cell, including empty space beyond the content. These empty areas captured pointer events.

**Fix:** Add `pointer-events: none` to the stretched container, `pointer-events: auto` to its direct children:

```css
.split-layout > .text-surface {
	align-content: center;
	pointer-events: none;
}
.split-layout > .text-surface > * {
	pointer-events: auto;
}
```

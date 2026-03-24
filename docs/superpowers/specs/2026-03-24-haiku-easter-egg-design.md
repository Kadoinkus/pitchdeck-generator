# Haiku Easter Egg

## Overview

A subtle haiku widget that appears across the UI in idle/empty/loading/error states. Displays random haiku from a static collection in Dutch and English. Minimal, poetic, surprising.

## Data Model

Static TypeScript array in `src/lib/data/haiku.ts`:

```ts
interface Haiku {
	lines: [string, string, string];
	lang: 'nl' | 'en';
	author?: string;
}
```

- ~20-30 haiku's as initial collection
- Mix of Dutch and English
- Classic and original haiku's
- Easy to extend (just push to array)

## Component

`src/lib/components/Haiku.svelte`

### Props

| Prop      | Type                            | Default     | Description                         |
| --------- | ------------------------------- | ----------- | ----------------------------------- |
| `variant` | `"inline" \| "card" \| "ghost"` | `"ghost"`   | Visual style                        |
| `lang`    | `"nl" \| "en" \| undefined`     | `undefined` | Filter by language, undefined = any |

### Variants

- **ghost** — transparent bg, muted text, minimal. For footers, empty states.
- **inline** — no decoration, flows with surrounding text. For loading messages.
- **card** — subtle bordered card with slight shadow. For error pages, prominent placement.

### Behavior

- Selects random haiku on mount
- Displays 3 lines centered, italic
- Optional author line below in smaller/muted text
- No interactivity (pure display)

## Placement

Integrate into existing components at these locations:

### 1. Loading states (AI generation)

In `OutputSection.svelte` or wherever the generation loading spinner lives — show a haiku below the spinner while waiting for AI to complete.

### 2. Empty slide preview

In `SlideViewer.svelte` or `SlideCanvas.svelte` — when no deck/slides exist yet, show a haiku instead of empty space.

### 3. Error/404 pages

In `+error.svelte` (SvelteKit error page) — poetic error message alongside the error info.

### 4. Footer

In root `+layout.svelte` or a footer component — subtle haiku that changes per page load.

## Styling

- Font: inherit from app (`"Sora"` / `"DM Sans"`)
- Text color: `var(--muted)` for ghost/inline, `var(--text)` for card
- Text align: center
- Font style: italic for haiku lines
- Author: smaller font size, normal style
- No animations (keep it zen)
- Responsive: works at any width (text wraps naturally)

## Content Guidelines

Haiku collection should include:

- Classic Japanese haiku (translated to NL/EN) — Basho, Issa, Buson
- Modern/original haiku fitting the app context (tech, creativity, presentations)
- Maintain authentic 5-7-5 syllable structure where possible
- Prioritize quality and genuine poetic feeling over strict form

## Out of Scope

- AI generation of haiku's
- User-submitted haiku's
- Haiku editing/favoriting
- Dedicated `/haiku` route
- Animations or transitions
- Persistence of which haiku was shown

## Testing

- Unit test: `haiku.test.ts` — verify data integrity (all entries have 3 lines, valid lang)
- Component test: `Haiku.svelte` renders without errors, shows 3 lines
- No E2E tests needed (Easter egg, non-critical)

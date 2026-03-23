# Panel-Based Deck Architecture Plan

## Goal
Move the slide system to a reusable panel library where:
- slide layout is fixed first
- content is injected into predefined panels
- text and image content fit panel bounds
- transparent text areas are supported
- rendering stays consistent for web preview, share view, PDF, and PPTX generation

## Core Principle
Each slide is a composition of panel presets.

Panel preset examples:
- `hero-title`: kicker + large title + accent phrase + optional subtitle
- `image-frame`: reserved visual zone (`cover` / `contain`)
- `icon-feature`: large icon + title + text
- `summary`: title + short paragraph
- `pricing-card`: tier + price + feature list
- `metric`: icon + short metric value/copy
- `bullet-stack`: compact list block

## Panel Contract
Each panel instance should define:
- `id`
- `preset`
- `variant` (`transparent`, `outlined`, `soft`, `solid`, `dark`)
- `content`
- `fitRules` (max chars/lines per slot)
- `slotTarget` (AI editable field binding)

## Styling Rules
- Transparent text panel: no fill, no border, no shadow.
- Supporting panel: white/soft surface with border radius.
- Outlined panel: no fill, clear border.
- Dark panel: high-contrast text and borders for dark slides.
- All panels use theme tokens only.

## Fit Rules
- Text:
  - panel-specific char budgets
  - line-clamp fallback for long copy
  - preserve hierarchy (headline > subtitle > body)
- Image:
  - frame leads, content follows
  - `cover` or `contain`
  - no distortion

## Export Parity Strategy
- Use one normalized slide model for all targets.
- Keep panel semantics (`variant`, `imageMode`, `fitRules`) in slide data.
- Web/share render from panel presets.
- PPTX/PDF builder should read the same panel semantics so layout intent remains consistent.

## Module Structure
- `public/js/slides/panels/presets.js`
  - panel preset renderers
- `public/js/slides/panels/variants.js`
  - panel variant class helpers
- `public/js/slides/panels/index.js`
  - barrel exports
- `public/js/slides/layouts/*.js`
  - compose slides with panel presets (no ad-hoc monolith markup)

## Implementation Phases
1. Add panel preset library files.
2. Refactor layout files to call panel presets.
3. Add panel variant CSS utilities.
4. Keep generation flow simple (no overflow runtime system).
5. Validate rendering in editor viewer and share page.

## Acceptance Criteria
- Slides are panel-composed and reusable.
- Transparent title/text panels are supported.
- Pricing uses a dedicated pricing panel preset.
- No dead overflow/density runtime logic.
- Code is split into modules, not a single monolith file.

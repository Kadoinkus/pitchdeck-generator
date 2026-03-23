# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Notso AI Pitch Deck Studio — an AI-powered pitch deck generator with fixed premium layouts, automatic content/image drafting via LLM, and multi-format export (PPTX, PDF, shareable link).

## Commands

- **Dev server**: `bun --hot src/server.js` (or `pnpm dev`)
- **Production**: `node src/server.js` (or `pnpm start`)
- **Lint + autofix**: `pnpm run lint` (Biome)
- **Format**: `pnpm run format` (Biome)
- **Typecheck**: `pnpm run typecheck` (tsgo --noEmit, JS files excluded via checkJs:false)

No test suite exists yet.

## Architecture

```
Express server (src/server.js)
  └─ API router (src/routes/api.js)
       ├─ AI orchestrator (src/ai/orchestrator.js)
       │    ├─ Local provider (stub/template responses)
       │    └─ OpenAI provider (LLM text + image prompts)
       ├─ Deck model (src/deck-model.js) — template manifest, field defs, layout presets
       ├─ Deck builder (src/deck-builder.js) — renders PptxGenJS presentations
       ├─ Slide data (src/slide-data.js) — wraps buildDeckModel for unified pipeline
       └─ Share store (src/share-store.js) — persists share tokens to generated/shares/

Browser client (public/)
  ├─ app.js — main editor UI, form state, AI autofill, localStorage persistence
  ├─ js/slides/index.js — renderer dispatcher (RENDERERS map by slide type)
  │    ├─ layouts/*.js — 15 slide layout renderers (cover, problem, solution, etc.)
  │    ├─ panels/ — reusable panel components (presets.js, variants.js)
  │    └─ core/ — theme vars, slot-policy, components, icons, utils
  ├─ js/viewer.js — preview rendering, thumbnail nav, export controls
  └─ css/ — base, slides, share, viewer stylesheets
```

## Key Patterns

- **ES modules everywhere** — no CommonJS, no bundler; direct browser imports for public/
- **Provider abstraction** — AI providers are swappable via orchestrator; add new ones in `src/ai/providers/`
- **Renderer registry** — slide layouts register in the `RENDERERS` map in `public/js/slides/index.js`; to add a slide type, create a layout in `layouts/`, export its render function, and register it
- **Slot policy** — `src/slot-policy.js` and `public/js/slides/core/slot-policy.js` define per-slide-type image/text placement rules (required, modes, defaults)
- **Theme system** — CSS custom properties (`--deck-primary`, `--deck-accent`, `--deck-secondary`, `--deck-bg`, `--deck-text`) applied at runtime via `public/js/slides/core/theme.js`
- **Sanitization** — all user inputs run through `safeText`, `normalizeList`, `safeColor`, `safeFont` helpers in `src/utils.js`
- **Stateless API** — every request is self-contained; no server sessions

## API Endpoints

- `POST /api/preview` — build slide data for client-side preview
- `POST /api/ai/autofill` — generate full deck draft (text + image prompts)
- `POST /api/ai/chat` — interactive chat field editing
- `POST /api/generate` — render PPTX, create share token
- `GET /api/share/:token` — retrieve shared deck

All responses: `{ success: true, ... }` or `{ success: false, message: "..." }`

## Environment Variables

- `PORT` (default: 3000)
- `OPENAI_API_KEY` — for OpenAI autofill
- `OPENAI_BASE_URL` — custom OpenAI endpoint (default: https://api.openai.com/v1)

## Code Style

- Biome: tab indentation, double quotes, recommended rules
- CSS specificity warnings and `!important` are suppressed in biome.json (intentional patterns)
- TypeScript strict mode for type checking but `checkJs` is off (pure JS project)
- Single template currently: "pitch-proposal" with 15 slide types

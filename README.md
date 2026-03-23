# Notso AI Pitch Deck Studio

AI-first pitch deck generator with fixed premium layouts, automatic content/image drafting, and multi-format delivery.

## What is implemented

- Minimal editor focused on:
  - `clientName`
  - `clientUrl`
  - slide include/exclude
  - optional brand + AI settings
- Automatic AI autofill for all slide text + image prompts
- Reserved image placeholders on every slide (viewer + PPTX)
- Viewer-first editing with a bottom-right chat widget
  - click any text/image placeholder in viewer
  - ask copilot to rewrite/change concept
  - apply suggestions and refresh live preview
- Exports:
  - PowerPoint (`.pptx`)
  - PDF (print-optimized share page)
- Share link generation:
  - `/share/:token`
  - smooth scroll-through deck page

## Core architecture

### 1) Template + model layer

- `src/deck-model.js`
  - template manifest
  - slide catalog
  - shared deck model for all renderers

### 2) Rendering layer

- `src/deck-builder.js`
  - PPTX output using PptxGenJS
- `public/js/slide-renderers.js`
  - browser slide rendering

### 3) AI layer

- `src/ai/orchestrator.js`
  - provider abstraction + fallback
- `src/ai/providers/local-provider.js`
- `src/ai/providers/openai-provider.js`

### 4) Share/export layer

- `src/share-store.js`
  - persisted share payload + slide data by token
- `src/routes/api.js`
  - generation, preview, AI, template, share APIs
- `public/share.html` + `public/js/share.js`
  - scroll-through share page + print-to-PDF flow

## API endpoints

- `GET /api/templates`
- `GET /api/editable-fields`
- `GET /api/ai/providers`
- `POST /api/ai/autofill`
- `POST /api/ai/chat`
- `POST /api/preview`
- `POST /api/generate`
- `GET /api/share/:token`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current defaults

Theme defaults are aligned to Notso-style direction:

- Primary: `#0B1F4D`
- Accent: `#00C4CC`
- Secondary: `#7D2AE8`
- Background: `#F4F8FF`
- Text: `#102347`

## Next SaaS steps

- Workspace authentication + RBAC
- Encrypted server-side API key vault
- Version history + approvals
- Outbound lead discovery + auto-personalized draft pipeline
- Email automation with share-link delivery

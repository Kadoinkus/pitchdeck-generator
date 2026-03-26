# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-26T11:51:29+01:00\
**Commit:** d2db76a\
**Branch:** broken-shit

## OVERVIEW

SvelteKit + TypeScript app that builds pitch decks, previews slides, and exports PPTX/PDF artifacts from tokenized share payloads. Core stack: Svelte 5 runes, Zod parsing, PptxGenJS, Playwright rendering path, Bun scripts.

## STRUCTURE

```text
pitchdeck-generator/
├── src/lib/              # domain + rendering + UI/shared runtime
│   ├── deck/             # canonical typed deck model + parse/build path
│   ├── slides/           # slide renderer system (core/layouts/panels)
│   ├── ai/               # provider orchestration + prompt/provider contracts
│   ├── server/           # server-only artifact/runtime helpers
│   ├── stores/           # app-level Svelte 5 rune state modules
│   └── components/       # editor/viewer UI, high interaction density
├── src/routes/
│   ├── api/              # HTTP boundary: share/download/pdf/ai (no generate)
│   ├── editor/           # authoring view (SSR disabled route-locally)
│   └── share/[token]/    # public viewer + print capture surface
├── AGENTS.md
└── src/**/AGENTS.md      # local guidance in high-complexity domains
```

## WHERE TO LOOK

| Task                            | Location                                     | Notes                                      |
| ------------------------------- | -------------------------------------------- | ------------------------------------------ |
| Deck input parse/default        | `src/lib/deck/schema.ts`                     | unknown input -> typed model boundary      |
| Slide inclusion + defaults      | `src/lib/deck/slide-registry.ts`             | single source of truth for slide specs     |
| Build deck model                | `src/lib/deck/build.ts`                      | content normalization + assembly           |
| Render slide components         | `src/lib/slides/SlideRenderer.svelte`        | dispatcher into layout components          |
| Publish deck + hash/idempotency | `src/lib/deck.remote.ts`                     | remote command; strips secrets             |
| Download PPTX                   | `src/routes/api/download/[token]/+server.ts` | cache + in-flight dedupe + fallback render |
| Render PDF                      | `src/routes/api/pdf/[token]/+server.ts`      | Playwright/Chromium print path             |
| AI chat/autofill                | `src/lib/ai/orchestrator.ts`                 | provider resolution + sanitization         |
| Share persistence               | `src/lib/share-store.ts`                     | filesystem-backed share record lifecycle   |

## CODE MAP

| Symbol/File              | Type         | Location                              | Role                                   |
| ------------------------ | ------------ | ------------------------------------- | -------------------------------------- |
| `parseDeckInput`         | function     | `src/lib/deck/schema.ts`              | runtime parse gate for raw payload     |
| `SLIDE_SPECS`            | const        | `src/lib/deck/slide-registry.ts`      | required/optional/default slide policy |
| `buildDeckModel`         | function     | `src/lib/deck/build.ts`               | transform typed input -> deck model    |
| `createDeckModel` facade | module       | `src/lib/deck-model.ts`               | stable consumer-facing API layer       |
| `SlideRenderer.svelte`   | component    | `src/lib/slides/SlideRenderer.svelte` | routes slide type -> layout renderer   |
| `editor.svelte.ts`       | store module | `src/lib/stores/editor.svelte.ts`     | form/editor state + persistence        |
| `viewer.svelte.ts`       | store module | `src/lib/stores/viewer.svelte.ts`     | navigation/view/chat shared state      |
| `orchestrator.ts`        | module       | `src/lib/ai/orchestrator.ts`          | AI provider orchestration contract     |

## CONVENTIONS (PROJECT-SPECIFIC)

- E2E tests are route-colocated (`*.e2e.ts`, `*.mobile.e2e.ts`) inside `src/routes/**`, not centralized under `tests/e2e`.
- Vitest config lives in `vite.config.ts` with split `client` and `server` projects.
- `expect.requireAssertions: true` is enabled for tests.
- `editor/+layout.ts` sets `ssr = false`; app is not globally CSR.
- `start` runs preview and `prestart` enforces full build first.
- Dprint (`bun run fmt`) is formatter; no Prettier config.
- Route/path generation uses `$app/paths.resolve(...)`; do not use deprecated `resolveRoute(...)`.
- Canonical deck/share theme key is `deckTheme`; do not reintroduce `theme` alias payloads.

## ANTI-PATTERNS (THIS PROJECT)

- Never persist secrets/API keys into share payload files.
- Do not bypass `parseDeckInput` boundary for raw external payloads.
- Do not add endpoint-specific response shapes that drift from established API patterns.
- Do not introduce duplicate slide policy logic outside deck registry unless migration demands it.
- Do not place unrelated ad-hoc assets/session notes in repo root.

## UNIQUE STYLES

- Deck subsystem favors parse-at-boundary + typed internals (Zod at ingress, typed contracts downstream).
- Rendering pipeline supports both template PptxGen generation and share-page capture fallback.
- UI state centralized in `.svelte.ts` rune modules instead of many component-local stores.

## COMMANDS

```bash
bun run dev
bun run test
bun run test:unit --run
bun run test:e2e
bun run build
bun run lint
bun run check
bun run fmt
```

## HIERARCHY

- `src/lib/AGENTS.md`
- `src/lib/deck/AGENTS.md`
- `src/lib/slides/AGENTS.md`
- `src/lib/ai/AGENTS.md`
- `src/lib/server/AGENTS.md`
- `src/routes/api/AGENTS.md`

## NOTES

- `README.md` and package description currently reflect legacy Node/Express wording; codebase is SvelteKit.
- Build artifacts may appear in-tree (`.svelte-kit`, `build`, `.vercel/output`, `test-results`); avoid treating as source.
- Write ONLY idiomatic svelte code.
- Always update and maintain this and every other `AGENTS.md` after making changes.
- When changing svelte code, always use the mcp and read the docs.
- ALWAYS maintain DISCOVERIES.md when learning new things about the codebase,
  even if they seem obvious or you think you will remember them.\
  This is crucial for building a shared knowledge base and avoiding information
  silos.
- Set an example of good documentation practices by being thorough, clear,
  and consistent in your updates to this file and any other documentation you
  contribute to.\
  Use svelte patterns in favor of more generic JavaScript/TypeScript patterns
  when writing code, and reflect that in your documentation.\
  This will help foster a culture of knowledge sharing and continuous learning
  within the team.
- Avoid indirection.

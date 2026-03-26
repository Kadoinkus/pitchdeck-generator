# LIB DOMAIN GUIDE

## OVERVIEW

`src/lib` contains core domain logic and shared runtime used by UI routes and server endpoints.

## STRUCTURE

```text
src/lib/
├── deck/          # typed deck parse/build contracts
├── slides/        # slide rendering system
├── ai/            # provider orchestration + prompts/providers
├── server/        # server-only rendering/storage helpers
├── stores/        # Svelte runes app state modules
├── components/    # UI/editor/viewer components
└── *.ts           # cross-cutting utils + facades
```

## WHERE TO LOOK

| Need                     | File                                               | Why                                   |
| ------------------------ | -------------------------------------------------- | ------------------------------------- |
| Canonical deck API       | `src/lib/deck-model.ts`                            | stable facade consumed by routes + AI |
| Deck parse/build path    | `src/lib/deck/schema.ts` + `src/lib/deck/build.ts` | raw payload -> typed model            |
| Slide payload builder    | `src/lib/slide-data.ts`                            | API preview/generate path adapter     |
| PPTX template render     | `src/lib/deck-builder.ts`                          | direct PptxGen output path            |
| Share persistence        | `src/lib/share-store.ts`                           | token/hash record lifecycle           |
| Shared guards/sanitizers | `src/lib/utils.ts`                                 | common parse/safety helpers           |

## CONVENTIONS

- Keep boundary strict: unknown external input parsed once, then typed.
- Keep facades thin (`deck-model.ts`, `slide-data.ts`): orchestration only, no duplicate domain logic.
- Server-only modules stay in `src/lib/server`; do not import in client-facing components.
- Prefer extending `deck/*` contracts over ad-hoc object shapes in callers.

## ANTI-PATTERNS

- Re-implementing parse/default logic outside `src/lib/deck/*`.
- Mixing route concerns (HTTP/status/Response) into `src/lib/*` domain files.
- Introducing `any`-driven payload plumbing that bypasses existing guards.

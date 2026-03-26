# SERVER RUNTIME GUIDE

## OVERVIEW

`src/lib/server` contains server-only artifact helpers for filesystem output and share-page capture rendering.

## STRUCTURE

```text
src/lib/server/
├── storage.ts         # output dir/env policy
└── pptx-from-share.ts # Playwright capture -> pptx pipeline
```

## WHERE TO LOOK

| Task                    | File                                | Notes                                  |
| ----------------------- | ----------------------------------- | -------------------------------------- |
| Output directory policy | `src/lib/server/storage.ts`         | `PITCHDECK_OUTPUT_DIR` + safe fallback |
| PPTX from share capture | `src/lib/server/pptx-from-share.ts` | Playwright/Chromium rendering path     |

## CONVENTIONS

- Keep these modules server-only; no direct import into client-rendered code.
- Preserve deterministic file path behavior for token/hash artifacts.
- Keep capture path resilient: timeouts/errors should surface clear failures to API handlers.
- Treat `deckTheme` as required theme metadata for share capture artifacts (no legacy `theme` fallback).

## ANTI-PATTERNS

- Writing artifacts outside configured output directory policy.
- Adding browser-only APIs in server capture code.
- Hiding capture/storage failures behind empty successful responses.

## NOTES

- Keep runtime assumptions aligned with deployment target (`@sparticuz/chromium`, Node runtime).

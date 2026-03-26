# DECK SUBSYSTEM GUIDE

## OVERVIEW

`src/lib/deck` is canonical deck domain boundary: parse raw input, normalize defaults, produce typed model.

## STRUCTURE

```text
src/lib/deck/
├── schema.ts          # raw payload parse gate
├── parsers.ts         # field-level coercion helpers
├── build.ts           # typed model assembly
├── slide-registry.ts  # inclusion/default policy
├── layout.ts          # slide layout metadata
└── types.ts           # canonical deck contracts
```

## WHERE TO LOOK

| Task                  | File                             | Notes                                   |
| --------------------- | -------------------------------- | --------------------------------------- |
| Parse raw payload     | `src/lib/deck/schema.ts`         | `parseDeckInput` is ingress gate        |
| Field-level coercion  | `src/lib/deck/parsers.ts`        | centralized scalar/list parsers         |
| Build domain model    | `src/lib/deck/build.ts`          | typed assembly path                     |
| Slide defaults policy | `src/lib/deck/slide-registry.ts` | single source for slide inclusion rules |
| Layout metadata       | `src/lib/deck/layout.ts`         | slide layout/label/color hints          |
| Core types            | `src/lib/deck/types.ts`          | domain contracts used app-wide          |

## CONVENTIONS

- Treat `schema.ts` as the only unknown->typed boundary for deck input.
- Keep `slide-registry.ts` authoritative for required/defaultIncluded semantics.
- Keep `deckTheme` as the only deck theme contract in `types.ts`; do not add legacy `theme` alias.
- Keep `build.ts` deterministic: same parsed input => same model.

## ANTI-PATTERNS

- Parsing request JSON directly in callers and skipping `parseDeckInput`.
- Duplicating slide inclusion logic in route handlers or UI.
- Making optional fields required in builders without schema migration path.

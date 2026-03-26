# API BOUNDARY GUIDE

## OVERVIEW

`src/routes/api` is HTTP boundary for share retrieval, artifact download, and AI actions. Publish uses remote command, not REST endpoint.

## STRUCTURE

```text
src/routes/api/
├── preview/+server.ts           # return normalized slide preview data
├── share/[token]/+server.ts     # fetch share payload by token
├── download/[token]/+server.ts  # return PPTX (cache/dedupe/fallback render)
├── pdf/[token]/+server.ts       # return PDF via print capture
├── ai/*/+server.ts              # providers/chat/autofill
├── templates/+server.ts         # template registry data
├── editable-fields/+server.ts   # editable field definitions
└── health/+server.ts            # health probe

src/lib/
├── deck.remote.ts               # publishDeck command (idempotent, secret-stripped)
├── ai.remote.ts                 # chat command
└── data.remote.ts               # templates/providers prerender queries
```

## WHERE TO LOOK

| Task                         | File                                         | Notes                                          |
| ---------------------------- | -------------------------------------------- | ---------------------------------------------- |
| Publish + persistence policy | `src/lib/deck.remote.ts`                     | idempotency via payload hash; secret stripping |
| Share retrieval              | `src/routes/api/share/[token]/+server.ts`    | token lookup + response shaping                |
| PPTX download                | `src/routes/api/download/[token]/+server.ts` | base64 cache + in-flight dedupe                |
| PDF rendering                | `src/routes/api/pdf/[token]/+server.ts`      | Playwright print path                          |
| AI chat/autofill             | `src/lib/ai.remote.ts`                       | chat command via remote function               |

## CONVENTIONS

- Keep route handlers thin: parse/validate, call lib modules, shape HTTP response.
- Maintain consistent JSON error envelope and status semantics across endpoints.
- Validate token/payload shape at boundary before expensive render/storage operations.

## ANTI-PATTERNS

- Persisting provider keys or other secrets in generated share records.
- Implementing endpoint-local deck parsing that bypasses deck schema boundary.
- Diverging response shape per endpoint for equivalent success/error classes.

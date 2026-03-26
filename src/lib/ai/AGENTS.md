# AI SUBSYSTEM GUIDE

## OVERVIEW

`src/lib/ai` orchestrates provider selection, prompt wiring, and sanitization of AI outputs before they touch editable deck fields.

## STRUCTURE

```text
src/lib/ai/
├── orchestrator.ts  # entrypoint for provider resolution + calls
├── prompts/         # prompt templates and prompt helpers
└── providers/       # provider adapters (openai/local) + contracts
```

## WHERE TO LOOK

| Task                    | File                                      | Notes                              |
| ----------------------- | ----------------------------------------- | ---------------------------------- |
| Provider selection      | `src/lib/ai/orchestrator.ts`              | fallback + capability routing      |
| Chat/autofill contracts | `src/lib/ai/providers/openai-provider.ts` | parse + filter returned JSON       |
| Local/offline behavior  | `src/lib/ai/providers/local-provider.ts`  | deterministic/local provider path  |
| Prompt definitions      | `src/lib/ai/prompts/*`                    | prompt shaping and context control |

## CONVENTIONS

- Treat provider output as untrusted; sanitize/whitelist fields before returning.
- Keep provider-specific HTTP/model details inside `providers/*`.
- Keep orchestrator focused on routing/error normalization, not prompt prose.

## ANTI-PATTERNS

- Returning raw LLM response objects to routes/components.
- Expanding editable-field surface without updating allowlist/sanitizers.
- Leaking API keys into persisted share/deck payloads.

# AI SUBSYSTEM GUIDE

## OVERVIEW

`src/lib/ai` provides multi-provider AI integration via Vercel AI SDK. Supports OpenAI, Anthropic, xAI, Groq, OpenRouter, and local LLMs (Ollama, LM Studio).

## STRUCTURE

```text
src/lib/ai/
├── registry.ts   # Provider definitions, model presets
├── config.ts     # localStorage schema, load/save
├── client.ts     # Streaming client, local vs remote routing
├── errors.ts     # AiError class, error codes
├── schemas.ts    # Zod schemas for AI responses
└── providers/
    └── local-provider.ts  # Template fallback (no LLM)
```

## WHERE TO LOOK

| Task                   | File                     | Notes                                      |
| ---------------------- | ------------------------ | ------------------------------------------ |
| Add provider           | `registry.ts`            | Add to PROVIDERS const                     |
| Modify response schema | `schemas.ts`             | ChatResponseSchema, AutofillResponseSchema |
| Change routing logic   | `client.ts`              | local vs remote decision                   |
| Config persistence     | `config.ts`              | localStorage key: `ai-config`              |
| Streaming endpoint     | `routes/api/ai/chat`     | Uses AI SDK streamText                     |
| Autofill endpoint      | `routes/api/ai/autofill` | Uses AI SDK generateText                   |

## CONVENTIONS

- Local providers (lmstudio, ollama, custom) call LLM directly from browser
- Remote providers proxy through server to hide API keys
- All responses parsed through Zod schemas before returning
- API keys stored in localStorage, never persisted server-side

## ANTI-PATTERNS

- Don't store API keys server-side or in share payloads
- Don't add providers without compile-time model validation where possible
- Don't bypass the client.ts routing logic

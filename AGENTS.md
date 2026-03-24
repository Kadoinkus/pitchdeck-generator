# Project Configuration

- **Language**: TypeScript
- **Package Manager**: bun
- **Add-ons**: eslint, vitest, playwright, sveltekit-adapter, devtools-json, mcp

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Mandatory Verification Protocol

After ANY code change:

1. Run test verification and never skip it. Use `bun run test` with the narrowest relevant filter available for the changed area.
2. Run the build with `bun run build` and confirm zero errors.
3. Run the linter with `bun lint` and confirm zero errors.
4. Run the Svelte checker with `bun check` and confirm zero errors.
5. If the change is visual or UI-related, describe what you expect to see and verify that the result matches.
6. If the change involves network or infrastructure behavior, actually test the relevant endpoint and report the real response.
7. If any step fails, fix it before reporting back to the user.
8. Never say "this should work". Only say "this works" when it is verified by a specific check you name.

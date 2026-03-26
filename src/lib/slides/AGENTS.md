# SLIDES SUBSYSTEM GUIDE

## OVERVIEW

`src/lib/slides` maps typed slide data to concrete presentation UI via dispatcher + layered layout components.

## STRUCTURE

```text
src/lib/slides/
├── SlideRenderer.svelte  # slide type dispatcher
├── types.ts              # share/view-side slide data contracts
├── core/                 # frame + slot policy + primitives
├── layouts/              # type-specific slide layouts
└── panels/               # reusable panel blocks
```

## WHERE TO LOOK

| Task                    | File                                  | Notes                                |
| ----------------------- | ------------------------------------- | ------------------------------------ |
| Dispatch type -> layout | `src/lib/slides/SlideRenderer.svelte` | central router for rendering         |
| Base frame behavior     | `src/lib/slides/core/Frame.svelte`    | shell, styling, print-safe structure |
| Slot policy             | `src/lib/slides/core/slot-policy.ts`  | density/rules for content slots      |
| Type-specific layout    | `src/lib/slides/layouts/*.svelte`     | per-slide composition                |
| Reusable visual blocks  | `src/lib/slides/panels/*.svelte`      | shared panel patterns                |

## CONVENTIONS

- New slide types require explicit dispatcher mapping and layout component.
- Keep core primitives generic; keep content assumptions in layouts.
- Favor stable prop contracts in `types.ts`; avoid implicit shape reads in components.

## ANTI-PATTERNS

- Embedding slide-type branching inside shared panel components.
- Mutating data in presentation layer; normalize upstream in deck builders.
- Adding ad-hoc slot rules in layout files that conflict with slot-policy modules.

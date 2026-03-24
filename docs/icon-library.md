# Icon Library Notes

## Selected Library

- Style basis: Heroicons-style stroke icons
- License model targeted: MIT-compatible free icon sets
- Rendering mode: Inline SVG with `currentColor`

## Why this fits the deck

- Color can be controlled from deck theme tokens.
- Icons stay crisp at large presentation sizes.
- No bitmap blur in PPT/share/view modes.

## Implementation

- Core icon renderer: `public/js/slides/core/icons.js`
- Icon manifest: `public/icons/manifest.json`
- All icons are semantic and mapped by slide context.

## Source references checked

- `https://heroicons.com/`
- `https://lucide.dev/`
- `https://iconoir.com/docs/introduction`

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		/**
		 * Viewer state for shallow routing (history API).
		 * Present = viewer is open. Omitting = closed.
		 * Literal `{ open: true }` prevents `{ open: false }` footgun.
		 */
		interface PageState {
			viewer?: { open: true };
		}
		// interface Platform {}
	}
}

export {};

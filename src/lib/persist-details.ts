/**
 * Svelte action that persists a `<details>` element's open/closed state
 * to localStorage under the given key.
 */

const STORAGE_PREFIX = 'detailsOpen:';

export function persistDetails(node: HTMLDetailsElement, key: string) {
	const storageKey = STORAGE_PREFIX + key;

	// Restore
	const saved = localStorage.getItem(storageKey);
	if (saved === 'true') node.open = true;
	else if (saved === 'false') node.open = false;
	// else: leave the HTML default

	function onToggle() {
		localStorage.setItem(storageKey, String(node.open));
	}

	node.addEventListener('toggle', onToggle);

	return {
		destroy() {
			node.removeEventListener('toggle', onToggle);
		},
	};
}

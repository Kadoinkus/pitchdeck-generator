/** Build a keydown handler that dispatches Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z|Y to undo/redo,
 *  skipping editable targets so native text undo still works. */
export function createUndoRedoHandler(
	undo: () => void,
	redo: () => void,
): (event: KeyboardEvent) => void {
	return (event: KeyboardEvent) => {
		if (!event.metaKey && !event.ctrlKey) return;

		const target = event.target;
		if (target instanceof HTMLInputElement) return;
		if (target instanceof HTMLTextAreaElement) return;
		if (target instanceof HTMLSelectElement) return;
		if (target instanceof HTMLElement && target.isContentEditable) return;

		const key = event.key.toLowerCase();
		const wantsUndo = key === 'z' && !event.shiftKey;
		const wantsRedo = (key === 'z' && event.shiftKey) || key === 'y';
		if (!wantsUndo && !wantsRedo) return;

		event.preventDefault();
		if (wantsUndo) {
			undo();
		} else {
			redo();
		}
	};
}

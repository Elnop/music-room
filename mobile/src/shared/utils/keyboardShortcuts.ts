export interface KeyboardShortcut {
	/** `KeyboardEvent.key`: `' '`, `'ArrowLeft'`, `'/'`, `'?'`. */
	key: string;
	/** Only for keys Shift does not change: `?` is typed with Shift on most layouts. */
	shift?: boolean;
	/** The keys as the help shows them. */
	keys: string;
	description: string;
	run: () => void;
}

/** The parts of a DOM `KeyboardEvent` and its target the shortcuts read; the project compiles without the DOM library. */
export interface ShortcutKeyEvent {
	key: string;
	shiftKey: boolean;
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	target: ShortcutTarget | null;
}

interface ShortcutTarget {
	tagName?: string;
	isContentEditable?: boolean;
	getAttribute?: (name: string) => string | null;
}

const TEXT_FIELDS = ['INPUT', 'TEXTAREA', 'SELECT'];

/** Controls that act on these keys themselves when focused. */
const OWN_KEYS: Record<string, string[]> = {
	' ': ['button', 'link', 'checkbox', 'switch', 'radio', 'tab', 'menuitem'],
	ArrowLeft: ['slider'],
	ArrowRight: ['slider'],
};

function isTypingTarget(target: ShortcutTarget | null): boolean {
	if (!target) return false;
	return TEXT_FIELDS.includes(target.tagName ?? '') || target.isContentEditable === true;
}

function handlesKeyItself(target: ShortcutTarget | null, key: string): boolean {
	const role = target?.getAttribute?.('role');
	return !!role && (OWN_KEYS[key]?.includes(role) ?? false);
}

/** The shortcut a key press runs, if any: none while typing, with Ctrl, Alt or Meta, or on a control that uses the key. */
export function matchShortcut(
	event: ShortcutKeyEvent,
	shortcuts: readonly KeyboardShortcut[]
): KeyboardShortcut | undefined {
	if (event.ctrlKey || event.altKey || event.metaKey) return undefined;
	if (isTypingTarget(event.target) || handlesKeyItself(event.target, event.key)) return undefined;
	return shortcuts.find(
		shortcut =>
			shortcut.key === event.key &&
			(shortcut.shift === undefined || shortcut.shift === event.shiftKey)
	);
}

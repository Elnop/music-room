export interface KeyboardShortcut {
	key: string;
	shift?: boolean;
	keys: string;
	description: string;
	run: () => void;
}

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

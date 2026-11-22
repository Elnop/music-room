import type {
	KeyboardShortcut,
	ShortcutKeyEvent,
	ShortcutTarget,
} from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';

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
	if (!role) return false;
	return OWN_KEYS[key]?.includes(role) ?? false;
}

export function matchShortcut(
	event: ShortcutKeyEvent,
	shortcuts: readonly KeyboardShortcut[],
): KeyboardShortcut | undefined {
	if (event.ctrlKey || event.altKey || event.metaKey) return undefined;
	if (isTypingTarget(event.target) || handlesKeyItself(event.target, event.key)) return undefined;
	return shortcuts.find(
		(shortcut) =>
			shortcut.key === event.key &&
			(shortcut.shift === undefined || shortcut.shift === event.shiftKey),
	);
}

import { matchShortcut } from '@/features/shell/lib/matchShortcut';
import type {
	KeyboardShortcut,
	ShortcutKeyEvent,
} from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';

function shortcut(key: string, shift?: boolean): KeyboardShortcut {
	return {
		key,
		shift,
		keys: key,
		description: key,
		run: jest.fn(),
	};
}

const SPACE = shortcut(' ');
const SEEK = shortcut('ArrowRight', false);
const NEXT = shortcut('ArrowRight', true);
const HELP = shortcut('?');
const SHORTCUTS = [SPACE, SEEK, NEXT, HELP];

function element(tagName: string, role: string | null = null, isContentEditable = false) {
	return {
		tagName,
		isContentEditable,
		getAttribute: (name: string) => (name === 'role' ? role : null),
	};
}

function press(key: string, overrides: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent {
	return {
		key,
		shiftKey: false,
		ctrlKey: false,
		altKey: false,
		metaKey: false,
		target: element('BODY'),
		...overrides,
	};
}

describe('matchShortcut', () => {
	it('tells the arrows from Shift and the arrows', () => {
		expect(matchShortcut(press('ArrowRight'), SHORTCUTS)).toBe(SEEK);
		expect(matchShortcut(press('ArrowRight', { shiftKey: true }), SHORTCUTS)).toBe(NEXT);
	});

	it('takes a key typed with Shift when the shortcut does not ask', () => {
		expect(matchShortcut(press('?', { shiftKey: true }), SHORTCUTS)).toBe(HELP);
	});

	it.each(['INPUT', 'TEXTAREA', 'SELECT'])('ignores a key typed in a %s', (tagName) => {
		expect(matchShortcut(press(' ', { target: element(tagName) }), SHORTCUTS)).toBeUndefined();
	});

	it('ignores a key typed in an editable element', () => {
		const target = element('DIV', null, true);
		expect(matchShortcut(press('?', { target }), SHORTCUTS)).toBeUndefined();
	});

	it('leaves Space to a focused button and the arrows to a focused slider', () => {
		expect(
			matchShortcut(press(' ', { target: element('DIV', 'button') }), SHORTCUTS),
		).toBeUndefined();
		expect(
			matchShortcut(press('ArrowRight', { target: element('DIV', 'slider') }), SHORTCUTS),
		).toBeUndefined();
		expect(
			matchShortcut(press('ArrowRight', { target: element('DIV', 'button') }), SHORTCUTS),
		).toBe(SEEK);
	});

	it.each(['ctrlKey', 'altKey', 'metaKey'] as const)(
		'leaves a key with %s to the browser',
		(key) => {
			expect(matchShortcut(press('ArrowRight', { [key]: true }), SHORTCUTS)).toBeUndefined();
		},
	);
});

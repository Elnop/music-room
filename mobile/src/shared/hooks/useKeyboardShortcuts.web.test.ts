import { renderHook } from '@testing-library/react-native';
import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';
import { useKeyboardShortcuts } from './useKeyboardShortcuts.web';

type Listener = (event: object) => void;

const listeners = new Set<Listener>();
let openDialog: object | null = null;
const fakeDocument = {
	addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
	removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
	querySelector: () => openDialog,
};

const keydown = (key: string) => {
	const event = {
		key,
		shiftKey: false,
		ctrlKey: false,
		altKey: false,
		metaKey: false,
		defaultPrevented: false,
		target: { tagName: 'BODY' },
		preventDefault: jest.fn(),
	};
	listeners.forEach(listener => listener(event));
	return event;
};

const help = (): KeyboardShortcut => ({ key: '?', keys: '?', description: 'Aide', run: jest.fn() });

describe('useKeyboardShortcuts (web)', () => {
	beforeEach(() => {
		Object.assign(globalThis, { document: fakeDocument });
		openDialog = null;
	});

	afterEach(() => {
		listeners.clear();
		delete (globalThis as { document?: unknown }).document;
	});

	it('runs the latest shortcut of a key and keeps the page from acting on it', () => {
		const first = help();
		const latest = help();
		const { rerender } = renderHook(
			({ shortcuts }: { shortcuts: KeyboardShortcut[] }) => useKeyboardShortcuts(shortcuts),
			{
				initialProps: { shortcuts: [first] },
			}
		);
		rerender({ shortcuts: [latest] });

		const event = keydown('?');

		expect(latest.run).toHaveBeenCalledTimes(1);
		expect(first.run).not.toHaveBeenCalled();
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('lets every key through while a dialog is open', () => {
		const shortcut = help();
		renderHook(() => useKeyboardShortcuts([shortcut]));
		openDialog = {};

		const event = keydown('?');

		expect(shortcut.run).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('stops listening once unmounted', () => {
		const { unmount } = renderHook(() => useKeyboardShortcuts([help()]));
		unmount();
		expect(listeners.size).toBe(0);
	});
});

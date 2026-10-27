import { renderHook } from '@testing-library/react-native';
import { PANEL_CLOSE_ID, PANEL_ID } from '@/features/player/constants';
import { usePanelFocus } from './usePanelFocus.web';

type Listener = (event: object) => void;

interface FakeElement {
	isConnected: boolean;
	focus: jest.Mock;
	contains: (other: unknown) => boolean;
	addEventListener: (type: string, listener: Listener) => void;
	removeEventListener: (type: string, listener: Listener) => void;
}

const listeners = new Set<Listener>();
const element = (): FakeElement => ({
	isConnected: true,
	focus: jest.fn(),
	contains: () => false,
	addEventListener: (_type, listener) => listeners.add(listener),
	removeEventListener: (_type, listener) => listeners.delete(listener),
});

let opener: FakeElement;
let close: FakeElement;
let panel: FakeElement;
const fakeDocument = {
	activeElement: null as FakeElement | null,
	body: element(),
	getElementById: (id: string) => (id === PANEL_ID ? panel : id === PANEL_CLOSE_ID ? close : null),
};

const keydown = (key: string) => {
	const event = { key, defaultPrevented: false, preventDefault: jest.fn() };
	listeners.forEach(listener => listener(event));
	return event;
};

describe('usePanelFocus (web)', () => {
	beforeEach(() => {
		opener = element();
		close = element();
		panel = element();
		fakeDocument.activeElement = opener;
		Object.assign(globalThis, { document: fakeDocument });
	});

	afterEach(() => {
		listeners.clear();
		delete (globalThis as { document?: unknown }).document;
	});

	it('moves the focus to the close button, and Escape closes', () => {
		const onClose = jest.fn();
		renderHook(() => usePanelFocus(onClose));
		expect(close.focus).toHaveBeenCalled();
		keydown('Enter');
		expect(onClose).not.toHaveBeenCalled();
		const event = keydown('Escape');
		expect(onClose).toHaveBeenCalled();
		expect(event.preventDefault).toHaveBeenCalled();
	});

	it('gives the focus back to the opener once closed', () => {
		const { unmount } = renderHook(() => usePanelFocus(jest.fn()));
		fakeDocument.activeElement = fakeDocument.body;
		unmount();
		expect(opener.focus).toHaveBeenCalled();
		expect(listeners.size).toBe(0);
	});

	it('leaves the focus where the user moved it', () => {
		const { unmount } = renderHook(() => usePanelFocus(jest.fn()));
		fakeDocument.activeElement = element();
		unmount();
		expect(opener.focus).not.toHaveBeenCalled();
	});
});

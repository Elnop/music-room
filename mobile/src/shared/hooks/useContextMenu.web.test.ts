import { renderHook } from '@testing-library/react-native';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import { useContextMenu, useContextMenuDismiss } from './useContextMenu.web';

type Handler = (event: object) => void;

const row = { getBoundingClientRect: () => ({ left: 40, top: 200, width: 900, height: 56 }) };

const browserEvent = (fields: object) => ({
	currentTarget: row,
	preventDefault: jest.fn(),
	stopPropagation: jest.fn(),
	...fields,
});

const handlers = (onOpen: (() => void) | undefined) =>
	renderHook(() => useContextMenu(onOpen)).result.current as {
		onContextMenu?: Handler;
		onKeyDown?: Handler;
	};

afterEach(() => useMenuAnchorStore.setState({ anchor: null }));

describe('useContextMenu (web)', () => {
	it('opens the menu at the pointer instead of the browser menu', () => {
		const onOpen = jest.fn(() =>
			expect(useMenuAnchorStore.getState().anchor).toEqual({
				x: 320,
				y: 410,
				width: 0,
				height: 0,
				align: 'start',
			})
		);
		const event = browserEvent({ clientX: 320, clientY: 410 });
		handlers(onOpen).onContextMenu?.(event);
		expect(onOpen).toHaveBeenCalledTimes(1);
		expect(event.preventDefault).toHaveBeenCalled();
		expect(event.stopPropagation).toHaveBeenCalled();
	});

	it.each([
		['the Menu key', { key: 'ContextMenu', shiftKey: false }],
		['Shift+F10', { key: 'F10', shiftKey: true }],
	])('opens the menu under the focused row with %s', (_name, key) => {
		const onOpen = jest.fn();
		const event = browserEvent(key);
		handlers(onOpen).onKeyDown?.(event);
		expect(onOpen).toHaveBeenCalledTimes(1);
		expect(event.preventDefault).toHaveBeenCalled();
		expect(useMenuAnchorStore.getState().anchor).toEqual({
			x: 40,
			y: 200,
			width: 900,
			height: 56,
			align: 'start',
		});
	});

	it('leaves the other keys alone', () => {
		const onOpen = jest.fn();
		const event = browserEvent({ key: 'F10', shiftKey: false });
		handlers(onOpen).onKeyDown?.(event);
		expect(onOpen).not.toHaveBeenCalled();
		expect(event.preventDefault).not.toHaveBeenCalled();
	});

	it('keeps the browser menu on an item without a menu', () => {
		expect(handlers(undefined)).toEqual({});
	});
});

describe('useContextMenuDismiss (web)', () => {
	it('closes the open menu on a right click, without the browser menu', () => {
		const onClose = jest.fn();
		const { onContextMenu } = renderHook(() => useContextMenuDismiss(onClose)).result.current as {
			onContextMenu: Handler;
		};
		const event = browserEvent({});
		onContextMenu(event);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(event.preventDefault).toHaveBeenCalled();
	});
});

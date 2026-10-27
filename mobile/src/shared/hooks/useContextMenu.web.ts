import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import type { ContextMenuProps } from './useContextMenu';

export type { ContextMenuProps } from './useContextMenu';

// The project compiles without the DOM library, so the parts of the events read here are typed.
interface BrowserElement {
	getBoundingClientRect(): { left: number; top: number; width: number; height: number };
}

interface BrowserEvent {
	currentTarget: BrowserElement;
	preventDefault(): void;
	stopPropagation(): void;
}

interface BrowserMouseEvent extends BrowserEvent {
	clientX: number;
	clientY: number;
}

interface BrowserKeyEvent extends BrowserEvent {
	key: string;
	shiftKey: boolean;
}

/** The keys of the browser's own context menu, on the element that has the focus. */
const isMenuKey = (event: BrowserKeyEvent) =>
	event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);

/** No menu, no handler: the browser keeps its own menu. */
const NONE: ContextMenuProps = {};

/** The item's menu opens at the pointer, or under the focused row, instead of the browser's menu. */
export function useContextMenu(onOpen: (() => void) | undefined): ContextMenuProps {
	if (!onOpen) return NONE;

	// stopPropagation: the innermost item wins, a row inside a card opens only its own menu.
	const open = (event: BrowserEvent, x: number, y: number, width: number, height: number) => {
		event.preventDefault();
		event.stopPropagation();
		useMenuAnchorStore.getState().setAnchor({ x, y, width, height, align: 'start' });
		onOpen();
	};

	return {
		onContextMenu: (event: BrowserMouseEvent) => open(event, event.clientX, event.clientY, 0, 0),
		onKeyDown: (event: BrowserKeyEvent) => {
			if (!isMenuKey(event)) return;
			const rect = event.currentTarget.getBoundingClientRect();
			open(event, rect.left, rect.top, rect.width, rect.height);
		},
	};
}

/** On an open menu and its backdrop, a right click closes the menu rather than open the browser's. */
export function useContextMenuDismiss(onClose: () => void): ContextMenuProps {
	return {
		onContextMenu: (event: BrowserEvent) => {
			event.preventDefault();
			onClose();
		},
	};
}

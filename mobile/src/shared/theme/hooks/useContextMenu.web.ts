import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { ContextMenuProps, MenuAnchor } from '@/shared/theme/types/menuTypes';

type BrowserElement = {
	getBoundingClientRect: () => { left: number; top: number; width: number; height: number };
};

type BrowserEvent = {
	currentTarget: BrowserElement;
	preventDefault: () => void;
	stopPropagation: () => void;
};

type BrowserMouseEvent = BrowserEvent & {
	clientX: number;
	clientY: number;
};

type BrowserKeyEvent = BrowserEvent & {
	key: string;
	shiftKey: boolean;
};

function isMenuKey(event: BrowserKeyEvent) {
	return event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);
}

const NONE: ContextMenuProps = {};

export function useContextMenu(onOpen: (() => void) | undefined): ContextMenuProps {
	if (!onOpen) return NONE;
	const openMenu = onOpen;

	function open(event: BrowserEvent, rect: Omit<MenuAnchor, 'align'>) {
		event.preventDefault();
		event.stopPropagation();
		menuAnchorActions.set({ ...rect, align: 'start' });
		openMenu();
	}

	return {
		onContextMenu: (event: BrowserMouseEvent) =>
			open(event, { x: event.clientX, y: event.clientY, width: 0, height: 0 }),
		onKeyDown: (event: BrowserKeyEvent) => {
			if (!isMenuKey(event)) return;
			const rect = event.currentTarget.getBoundingClientRect();
			open(event, { x: rect.left, y: rect.top, width: rect.width, height: rect.height });
		},
	};
}

export function useContextMenuDismiss(onClose: () => void): ContextMenuProps {
	return {
		onContextMenu: (event: BrowserEvent) => {
			event.preventDefault();
			onClose();
		},
	};
}

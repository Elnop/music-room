import { useMenuAnchorStore } from '@/shared/theme/menuAnchorStore';
import type { ContextMenuProps } from '@/shared/theme/hooks/useContextMenu';

export type { ContextMenuProps } from '@/shared/theme/hooks/useContextMenu';

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

function isMenuKey(event: BrowserKeyEvent) {
	return event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey);
}

const NONE: ContextMenuProps = {};

export function useContextMenu(onOpen: (() => void) | undefined): ContextMenuProps {
	if (!onOpen) return NONE;
	const openMenu = onOpen;

	function open(event: BrowserEvent, x: number, y: number, width: number, height: number) {
		event.preventDefault();
		event.stopPropagation();
		useMenuAnchorStore.getState().setAnchor({ x, y, width, height, align: 'start' });
		openMenu();
	}

	return {
		onContextMenu: (event: BrowserMouseEvent) => open(event, event.clientX, event.clientY, 0, 0),
		onKeyDown: (event: BrowserKeyEvent) => {
			if (!isMenuKey(event)) return;
			const rect = event.currentTarget.getBoundingClientRect();
			open(event, rect.left, rect.top, rect.width, rect.height);
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

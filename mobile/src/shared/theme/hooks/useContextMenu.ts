/** Web only: a right click or the menu key opens the item's menu. */
export interface ContextMenuProps {
	onContextMenu?: unknown;
	onKeyDown?: unknown;
}

const NONE: ContextMenuProps = {};

/** Native: a long press or the « ⋯ » button opens the menu instead. */
export function useContextMenu(_onOpen: (() => void) | undefined): ContextMenuProps {
	return NONE;
}

export function useContextMenuDismiss(_onClose: () => void): ContextMenuProps {
	return NONE;
}

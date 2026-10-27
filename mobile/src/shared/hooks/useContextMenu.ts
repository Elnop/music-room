/** The props a list item spreads on its row so a right click or the keyboard opens its menu (web). */
export interface ContextMenuProps {
	onContextMenu?: unknown;
	onKeyDown?: unknown;
}

const NONE: ContextMenuProps = {};

/** Native platforms have no context menu: a long press or the « ⋯ » button opens the item's menu. */
export function useContextMenu(_onOpen: (() => void) | undefined): ContextMenuProps {
	return NONE;
}

/** Native platforms have no context menu to keep away from an open menu. */
export function useContextMenuDismiss(_onClose: () => void): ContextMenuProps {
	return NONE;
}

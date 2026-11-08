export interface ContextMenuProps {
	onContextMenu?: unknown;
	onKeyDown?: unknown;
}

const NONE: ContextMenuProps = {};

export function useContextMenu(_onOpen: (() => void) | undefined): ContextMenuProps {
	return NONE;
}

export function useContextMenuDismiss(_onClose: () => void): ContextMenuProps {
	return NONE;
}

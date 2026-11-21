import type { ContextMenuProps } from '@/shared/theme/types/menuTypes';

const NONE: ContextMenuProps = {};

export function useContextMenu(_onOpen: (() => void) | undefined): ContextMenuProps {
	return NONE;
}

export function useContextMenuDismiss(_onClose: () => void): ContextMenuProps {
	return NONE;
}

import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { useHover } from '@/features/playlists/features/editor/features/detail/hooks/useHover';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export function useTableRowPointer(onShowActions?: (anchor?: MenuAnchor) => void) {
	const { hovered, hoverProps } = useHover();
	const contextMenu = useContextMenu(onShowActions);
	return { hovered, pointerProps: { ...hoverProps, ...contextMenu } };
}

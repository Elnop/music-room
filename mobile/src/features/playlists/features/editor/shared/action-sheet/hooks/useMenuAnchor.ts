import { useEffect, useState } from 'react';
import { useMenuAnchorState } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useMenuAnchorState';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

export function useMenuAnchor(visible: boolean): MenuAnchor | null {
	const recorded = useMenuAnchorState(state => state.anchor);
	const [anchor, setAnchor] = useState<MenuAnchor | null>(visible ? recorded : null);
	const [wasVisible, setWasVisible] = useState(visible);
	if (visible !== wasVisible) {
		setWasVisible(visible);
		if (visible) setAnchor(recorded);
	}

	useEffect(() => {
		if (visible && recorded) menuAnchorActions.set(null);
	}, [visible, recorded]);

	return anchor;
}

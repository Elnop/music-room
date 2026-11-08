import { useEffect, useState } from 'react';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

export function useMenuAnchor(visible: boolean): MenuAnchor | null {
	const recorded = useMenuAnchorStore(state => state.anchor);
	const [anchor, setAnchor] = useState<MenuAnchor | null>(visible ? recorded : null);
	const [wasVisible, setWasVisible] = useState(visible);
	if (visible !== wasVisible) {
		setWasVisible(visible);
		if (visible) setAnchor(recorded);
	}

	useEffect(() => {
		if (visible && recorded) useMenuAnchorStore.getState().setAnchor(null);
	}, [visible, recorded]);

	return anchor;
}

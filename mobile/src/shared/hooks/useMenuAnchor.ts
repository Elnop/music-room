import { useEffect, useState } from 'react';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

/** Takes the anchor its button recorded as the menu opens, and keeps it until the menu has closed. */
export function useMenuAnchor(visible: boolean): MenuAnchor | null {
	const recorded = useMenuAnchorStore(state => state.anchor);
	// A menu mounted already open (its first target just chosen) takes the anchor at once.
	const [anchor, setAnchor] = useState<MenuAnchor | null>(visible ? recorded : null);
	const [wasVisible, setWasVisible] = useState(visible);
	if (visible !== wasVisible) {
		setWasVisible(visible);
		if (visible) setAnchor(recorded);
	}

	// Consumed, so a menu opened by a long press next is not placed under this button.
	useEffect(() => {
		if (visible && recorded) useMenuAnchorStore.getState().setAnchor(null);
	}, [visible, recorded]);

	return anchor;
}

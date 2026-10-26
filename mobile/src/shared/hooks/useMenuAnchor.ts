import { useEffect, useState } from 'react';
import { useMenuAnchorStore } from '@/shared/stores/menuAnchorStore';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

/** Takes the anchor its button recorded as the menu opens, and keeps it until the menu has closed. */
export function useMenuAnchor(visible: boolean): MenuAnchor | null {
	const recorded = useMenuAnchorStore(state => state.anchor);
	const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
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

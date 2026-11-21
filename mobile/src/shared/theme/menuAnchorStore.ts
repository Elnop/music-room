import { create } from 'zustand';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

type MenuAnchorState = {
	anchor: MenuAnchor | null;
	setAnchor: (anchor: MenuAnchor | null) => void;
};

export const useMenuAnchorStore = create<MenuAnchorState>(set => ({
	anchor: null,
	setAnchor: anchor => set({ anchor }),
}));

export function recordMenuAnchor(anchor?: MenuAnchor): void {
	if (anchor) useMenuAnchorStore.getState().setAnchor(anchor);
}

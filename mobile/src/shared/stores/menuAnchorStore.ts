import { create } from 'zustand';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

interface MenuAnchorState {
	/** null for a menu opened another way (a long press). */
	anchor: MenuAnchor | null;
	setAnchor: (anchor: MenuAnchor | null) => void;
}

export const useMenuAnchorStore = create<MenuAnchorState>(set => ({
	anchor: null,
	setAnchor: anchor => set({ anchor }),
}));

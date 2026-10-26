import { create } from 'zustand';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';

interface MenuAnchorState {
	/** The button that opened the current menu; null for a menu opened another way (a long press). */
	anchor: MenuAnchor | null;
	setAnchor: (anchor: MenuAnchor | null) => void;
}

/** Wide screens drop a menu down from its button; the phone never sets it and keeps the bottom sheet. */
export const useMenuAnchorStore = create<MenuAnchorState>(set => ({
	anchor: null,
	setAnchor: anchor => set({ anchor }),
}));

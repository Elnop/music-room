import { createStore } from 'zustand/vanilla';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

type MenuAnchorState = {
	anchor: MenuAnchor | null;
};

export const menuAnchorStore = createStore<MenuAnchorState>(() => ({
	anchor: null,
}));

export const menuAnchorActions = {
	set: (anchor: MenuAnchor | null) => menuAnchorStore.setState({ anchor }),
	record: (anchor?: MenuAnchor) => {
		if (anchor) menuAnchorStore.setState({ anchor });
	},
};

import { useStore } from 'zustand';
import { menuAnchorStore } from '@/shared/theme/menuAnchorStore';

type MenuAnchorState = ReturnType<typeof menuAnchorStore.getState>;

export function useMenuAnchorState<Selected>(selector: (state: MenuAnchorState) => Selected) {
	return useStore(menuAnchorStore, selector);
}

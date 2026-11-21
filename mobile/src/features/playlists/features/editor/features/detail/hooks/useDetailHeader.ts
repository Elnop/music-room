import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import type { DetailNavigation } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useDetailHeader(navigation: DetailNavigation, headerRight: () => ReactNode): void {
	useLayoutEffect(() => {
		navigation.setOptions({ headerTransparent: true, headerTitle: '', headerRight });
	}, [navigation, headerRight]);
}

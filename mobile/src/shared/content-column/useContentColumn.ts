import { useContext, useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { ContentColumnContext } from '@/shared/content-column/contentColumnConfig';

export function useContentColumn(): ViewStyle | null {
	const maxWidth = useContext(ContentColumnContext);
	return useMemo(
		() => (maxWidth ? { width: '100%', maxWidth, alignSelf: 'center' } : null),
		[maxWidth]
	);
}

import { createContext, useContext, useMemo } from 'react';
import type { ViewStyle } from 'react-native';

export const ContentColumnContext = createContext<number | null>(null);

export function useContentColumn(): ViewStyle | null {
	const maxWidth = useContext(ContentColumnContext);
	return useMemo(
		() => (maxWidth ? { width: '100%', maxWidth, alignSelf: 'center' } : null),
		[maxWidth]
	);
}

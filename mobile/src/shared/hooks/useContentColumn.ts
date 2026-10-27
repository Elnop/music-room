import { createContext, useContext, useMemo } from 'react';
import type { ViewStyle } from 'react-native';

/** Set by ContentContainer for a screen that scrolls across the whole content area: its column's width. */
export const ContentColumnContext = createContext<number | null>(null);

/** The column such a screen centres its content in, scroll content included; none elsewhere. */
export function useContentColumn(): ViewStyle | null {
	const maxWidth = useContext(ContentColumnContext);
	return useMemo(
		() => (maxWidth ? { width: '100%', maxWidth, alignSelf: 'center' } : null),
		[maxWidth]
	);
}

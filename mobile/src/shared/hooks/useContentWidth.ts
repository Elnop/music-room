import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

/** Set by ContentContainer on wide screens; the phone has none and uses the whole window. */
export const ContentWidthContext = createContext<number | null>(null);

/** The width the current screen's content is laid out in, for grids sized in points. */
export function useContentWidth(): number {
	const contained = useContext(ContentWidthContext);
	const { width } = useWindowDimensions();
	return contained ?? width;
}

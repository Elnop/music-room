import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';

export const ContentWidthContext = createContext<number | null>(null);

export function useContentWidth(): number {
	const contained = useContext(ContentWidthContext);
	const { width } = useWindowDimensions();
	return contained ?? width;
}

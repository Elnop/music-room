import { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { ContentWidthContext } from '@/shared/theme/configs/contentWidthConfig';

export function useContentWidth(): number {
	const contained = useContext(ContentWidthContext);
	const { width } = useWindowDimensions();
	return contained ?? width;
}

import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export function useScreenTitle(title: string | undefined): void {
	const navigation = useNavigation();
	useEffect(() => {
		if (title) navigation.setOptions({ title });
	}, [navigation, title]);
}

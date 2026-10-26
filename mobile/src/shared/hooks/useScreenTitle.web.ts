import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

/** The browser tab's title for a screen whose header shows no name: its `headerTitle` keeps the header empty. */
export function useScreenTitle(title: string | undefined): void {
	const navigation = useNavigation();
	useEffect(() => {
		if (title) navigation.setOptions({ title });
	}, [navigation, title]);
}

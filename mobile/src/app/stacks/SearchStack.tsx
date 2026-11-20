import React from 'react';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { playbackActions } from '@/features/playback/lib/playbackActions';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchContainer } from '@/features/search/components/SearchContainer';
import { screenLayout } from '@/features/shell/screenLayout';
import { useStackOptions } from '@/features/shell/hooks/useStackOptions';

type SearchStackParamList = {
	Search: undefined;
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const layout = screenLayout(true);

export function SearchNavigator() {
	const stackOptions = useStackOptions();

	return (
		<SearchStack.Navigator screenLayout={layout} screenOptions={stackOptions}>
			<SearchStack.Screen name="Search" options={{ title: 'Recherche' }}>
				{() => <SearchContainer TrackActionsSheet={TrackActionsSheet} playback={playbackActions} />}
			</SearchStack.Screen>
		</SearchStack.Navigator>
	);
}

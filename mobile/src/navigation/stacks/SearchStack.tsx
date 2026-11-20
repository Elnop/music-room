import React from 'react';
import { TrackActionsSheetContainer } from '@/features/playlists/features/editor/features/track-actions/components/TrackActionsSheetContainer';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { SearchContainer } from '@/features/search/components/SearchContainer';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';

type SearchStackParamList = {
	Search: undefined;
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const layout = screenLayout(true);

export function SearchNavigator() {
	const { theme } = useTheme();
	const { isWide } = useBreakpoint();

	return (
		<SearchStack.Navigator
			screenLayout={layout}
			screenOptions={{
				...(isWide ? { header: screenHeader } : null),
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: headerTitle(theme),
				headerTitleAlign: 'center',
			}}
		>
			<SearchStack.Screen name="Search" options={{ title: 'Recherche' }}>
				{() => <SearchContainer TrackActionsSheet={TrackActionsSheetContainer} />}
			</SearchStack.Screen>
		</SearchStack.Navigator>
	);
}

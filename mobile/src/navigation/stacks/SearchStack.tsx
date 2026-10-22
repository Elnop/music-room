/**
 * Search Feature Navigation Stack
 *
 * Architecture:
 * - Pages principales: Header opaque standard avec effet blur natif iOS
 */

import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SoundCloudSearchScreen } from '@/screens/search/SoundCloudSearchScreen';

type SearchStackParamList = {
	Search: undefined;
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();

export function SearchNavigator() {
	const { theme } = useTheme();

	return (
		<SearchStack.Navigator
			screenOptions={{
				// Header opaque avec effet blur natif sur iOS
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerBlurEffect: Platform.OS === 'ios' ? 'systemMaterialDark' : undefined,
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: {
					fontWeight: theme.typography.weights.bold,
				},
				headerTitleAlign: 'center',
			}}
		>
			<SearchStack.Screen
				name="Search"
				component={SoundCloudSearchScreen}
				options={{ title: 'Recherche' }}
			/>
		</SearchStack.Navigator>
	);
}

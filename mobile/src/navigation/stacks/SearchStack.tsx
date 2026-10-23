import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SearchOrchestrator } from '@/features/search/searchScreen/components/orchestrators/SearchOrchestrator';

type SearchStackParamList = {
	Search: undefined;
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();

export function SearchNavigator() {
	const { theme } = useTheme();

	return (
		<SearchStack.Navigator
			screenOptions={{
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
				component={SearchOrchestrator}
				options={{ title: 'Recherche' }}
			/>
		</SearchStack.Navigator>
	);
}

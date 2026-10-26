import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SearchOrchestrator } from '@/features/search/searchScreen/components/orchestrators/SearchOrchestrator';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';

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
				headerTitleStyle: {
					fontFamily: theme.typography.families.bold,
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

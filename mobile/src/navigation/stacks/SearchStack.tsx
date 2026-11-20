import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SearchContainer } from '@/features/search/searchScreen/components/SearchContainer';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { screenHeader, screenLayout } from '@/navigation/screenLayout';
import { headerTitle } from '@/shared/theme/pixelFrame';

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
			<SearchStack.Screen
				name="Search"
				component={SearchContainer}
				options={{ title: 'Recherche' }}
			/>
		</SearchStack.Navigator>
	);
}

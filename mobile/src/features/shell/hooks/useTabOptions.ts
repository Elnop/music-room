import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabIconFor } from '@/features/shell/lib/tabIconFor';
import { sidebarTabOptions } from '@/features/shell/lib/sidebarTabOptions';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { TAB_BAR_HEIGHT, TAB_BAR_PADDING } from '@/shared/theme/configs/layoutConfig';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';

const HIDDEN_ON_DESKTOP: BottomTabNavigationOptions = { tabBarItemStyle: { display: 'none' } };

function tabScreenOptions(
	theme: Theme,
	tabBar: ViewStyle,
	sidebar: BottomTabNavigationOptions | null
) {
	return ({ route }: { route: { name: string } }): BottomTabNavigationOptions => ({
		tabBarActiveTintColor: theme.colors.primary,
		tabBarInactiveTintColor: theme.colors.textSecondary,
		tabBarStyle: tabBar,
		tabBarShowLabel: false,
		headerStyle: { backgroundColor: theme.colors.background },
		headerTintColor: theme.colors.text,
		headerShadowVisible: false,
		headerTitleStyle: headerTitle(theme),
		...sidebar,
		tabBarIcon: tabIconFor(route.name),
	});
}

export function useTabOptions() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { breakpoint } = useBreakpoint();
	const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const screenOptions = useMemo(
		() => tabScreenOptions(theme, styles.tabBar, sidebarTabOptions(breakpoint, theme)),
		[theme, styles, breakpoint]
	);
	return { screenOptions, hiddenOnDesktop: breakpoint === 'desktop' ? HIDDEN_ON_DESKTOP : null };
}

function createStyles(theme: Theme, bottomInset: number) {
	const styles = StyleSheet.create({
		tabBar: {
			height: TAB_BAR_HEIGHT + bottomInset,
			paddingTop: TAB_BAR_PADDING,
			paddingBottom: bottomInset + TAB_BAR_PADDING,
			backgroundColor: theme.colors.background,
			borderTopWidth: theme.borders.thick,
			borderTopColor: theme.colors.border,
			elevation: 0,
		},
	});
	return styles;
}

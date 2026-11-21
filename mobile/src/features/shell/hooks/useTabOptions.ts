import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabIconFor } from '@/features/shell/components/presenters/TabIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import type { Breakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { TAB_BAR_HEIGHT } from '@/shared/theme/lib/layout';
import { headerTitle } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';

const sidebarOptions = (
	breakpoint: Exclude<Breakpoint, 'phone'>,
	theme: Theme
): BottomTabNavigationOptions => ({
	tabBarPosition: 'left',
	tabBarVariant: breakpoint === 'tablet' ? 'material' : 'uikit',
	tabBarShowLabel: true,
	tabBarLabelPosition: breakpoint === 'tablet' ? 'below-icon' : 'beside-icon',
	tabBarActiveTintColor: theme.colors.text,
	tabBarActiveBackgroundColor: theme.colors.surfaceAlt,
	tabBarLabelStyle:
		breakpoint === 'tablet'
			? { fontSize: theme.typography.sizes.sm, marginTop: theme.spacing.xs }
			: {
					fontSize: theme.typography.sizes.md,
					fontFamily: theme.typography.families.semibold,
					marginStart: theme.spacing.md,
				},
	tabBarStyle: {
		flex: 1,
		minWidth: 0,
		paddingTop: theme.spacing.md,
		paddingStart: breakpoint === 'tablet' ? theme.spacing.xs : theme.spacing.sm,
		paddingEnd: breakpoint === 'tablet' ? theme.spacing.xs : theme.spacing.sm,
		backgroundColor: 'transparent',
		borderRightWidth: 0,
	},
});

export function useTabOptions() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { breakpoint } = useBreakpoint();
	const styles = useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const sidebar = useMemo(
		() => (breakpoint === 'phone' ? null : sidebarOptions(breakpoint, theme)),
		[breakpoint, theme]
	);

	const screenOptions = ({ route }: { route: { name: string } }): BottomTabNavigationOptions => ({
		tabBarActiveTintColor: theme.colors.primary,
		tabBarInactiveTintColor: theme.colors.textSecondary,
		tabBarStyle: styles.tabBar,
		tabBarShowLabel: false,
		headerStyle: { backgroundColor: theme.colors.background },
		headerTintColor: theme.colors.text,
		headerShadowVisible: false,
		headerTitleStyle: headerTitle(theme),
		...sidebar,
		tabBarIcon: tabIconFor(route.name),
	});

	const hiddenOnDesktop: BottomTabNavigationOptions | null =
		breakpoint === 'desktop' ? { tabBarItemStyle: { display: 'none' } } : null;

	return { screenOptions, hiddenOnDesktop };
}

const createStyles = (theme: Theme, bottomInset: number) => {
	const styles = StyleSheet.create({
		tabBar: {
			height: TAB_BAR_HEIGHT + bottomInset,
			paddingTop: 10,
			paddingBottom: bottomInset + 10,
			backgroundColor: theme.colors.background,
			borderTopWidth: theme.borders.thick,
			borderTopColor: theme.colors.border,
			elevation: 0,
		},
	});
	return styles;
};

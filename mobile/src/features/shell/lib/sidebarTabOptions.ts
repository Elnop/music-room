import type { TextStyle, ViewStyle } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

function sidebarLabelStyle(isTablet: boolean, theme: Theme): TextStyle {
	if (isTablet) return { fontSize: theme.typography.sizes.sm, marginTop: theme.spacing.xs };
	return {
		fontSize: theme.typography.sizes.md,
		fontFamily: theme.typography.families.semibold,
		marginStart: theme.spacing.md,
	};
}

function sidebarBarStyle(isTablet: boolean, theme: Theme): ViewStyle {
	const sidePadding = isTablet ? theme.spacing.xs : theme.spacing.sm;
	return {
		flex: 1,
		minWidth: 0,
		paddingTop: theme.spacing.md,
		paddingStart: sidePadding,
		paddingEnd: sidePadding,
		backgroundColor: 'transparent',
		borderRightWidth: 0,
	};
}

export function sidebarTabOptions(
	breakpoint: Breakpoint,
	theme: Theme
): BottomTabNavigationOptions | null {
	if (breakpoint === 'phone') return null;
	const isTablet = breakpoint === 'tablet';
	return {
		tabBarPosition: 'left',
		tabBarVariant: isTablet ? 'material' : 'uikit',
		tabBarShowLabel: true,
		tabBarLabelPosition: isTablet ? 'below-icon' : 'beside-icon',
		tabBarActiveTintColor: theme.colors.text,
		tabBarActiveBackgroundColor: theme.colors.surfaceAlt,
		tabBarLabelStyle: sidebarLabelStyle(isTablet, theme),
		tabBarStyle: sidebarBarStyle(isTablet, theme),
	};
}

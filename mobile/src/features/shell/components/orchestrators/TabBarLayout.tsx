import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PixelWordmark } from '@/shared/theme/components/PixelWordmark';
import { PIXEL } from '@/shared/theme/configs/tokensConfig';
import { SIDEBAR_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { SidebarAccountContainer } from '@/features/shell/components/orchestrators/SidebarAccountContainer';

export function TabBarLayout({
	miniPlayer,
	...props
}: BottomTabBarProps & { miniPlayer: React.ReactNode }) {
	const { breakpoint, isDesktop } = useBreakpoint();
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	if (breakpoint === 'phone') {
		return (
			<View>
				{miniPlayer}
				<BottomTabBar {...props} />
			</View>
		);
	}

	return (
		<View
			style={[
				styles.sidebar,
				{
					width: SIDEBAR_WIDTH[breakpoint],
					paddingTop: insets.top + theme.spacing.md,
					backgroundColor: theme.colors.background,
					borderRightColor: theme.colors.border,
				},
			]}
		>
			<View style={styles.brand}>
				<PixelWordmark size={isDesktop ? 24 : 12} />
			</View>
			<BottomTabBar {...props} />
			{isDesktop && (
				<SidebarAccountContainer
					active={props.state.routes[props.state.index].name === 'ProfileTab'}
					onPress={() => props.navigation.navigate('ProfileTab')}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	sidebar: {
		borderRightWidth: PIXEL,
	},
	brand: { alignItems: 'center', paddingVertical: 12 },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayerContainer } from '@/features/playback/features/mini-player/components/MiniPlayerContainer';
import { PixelWordmark } from '@/shared/theme/components/PixelWordmark';
import { PIXEL } from '@/shared/theme/lib/tokens';
import { SIDEBAR_WIDTH } from '@/shared/theme/lib/layout';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { SidebarAccount } from './SidebarAccount';

/** The phone's mini-player sits on the tab bar; wide screens leave the player to AppNavigator. */
export function AppTabBar(props: BottomTabBarProps) {
	const { breakpoint, isDesktop } = useBreakpoint();
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	if (breakpoint === 'phone') {
		return (
			<View>
				<MiniPlayerContainer />
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
				<SidebarAccount
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

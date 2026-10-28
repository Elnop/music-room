import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '@/features/player/miniPlayer/components/orchestrators/MiniPlayer';
import { PixelWordmark } from '@/shared/components/media/PixelWordmark';
import { PIXEL } from '@/shared/theme/tokens';
import { SIDEBAR_WIDTH } from '@/shared/constants/layout';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SidebarAccount } from './SidebarAccount';

/** The phone's mini-player sits on the bottom tab bar; the side bar of wide screens leaves the player to AppNavigator. */
export function AppTabBar(props: BottomTabBarProps) {
	const { breakpoint, isDesktop } = useBreakpoint();
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();

	if (breakpoint === 'phone') {
		return (
			<View>
				<MiniPlayer />
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

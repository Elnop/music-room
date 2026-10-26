import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MiniPlayer } from '@/features/player/miniPlayer/components/orchestrators/MiniPlayer';
import logo from '@/assets/logo/logo.png';
import appIcon from '@/assets/logo/app-icon.png';
import { SIDEBAR_WIDTH } from '@/shared/constants/layout';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/ThemeContext';
import { SidebarAccount } from './SidebarAccount';

/** The phone's mini-player sits on the bottom tab bar; the side bar of wide screens leaves the player to AppNavigator. */
export function AppTabBar(props: BottomTabBarProps) {
	const { breakpoint, isDesktop } = useBreakpoint();
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const separator = useSeparatorColor();

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
					borderRightColor: separator,
				},
			]}
		>
			<Image
				source={isDesktop ? logo : appIcon}
				style={isDesktop ? styles.logo : styles.icon}
				resizeMode="contain"
				accessibilityLabel="Zumik"
			/>
			<BottomTabBar {...props} />
			{isDesktop && <SidebarAccount onPress={() => props.navigation.navigate('ProfileTab')} />}
		</View>
	);
}

const styles = StyleSheet.create({
	sidebar: {
		borderRightWidth: 1,
	},
	logo: {
		width: 96,
		height: 96,
		alignSelf: 'center',
	},
	icon: {
		width: 48,
		height: 48,
		alignSelf: 'center',
	},
});

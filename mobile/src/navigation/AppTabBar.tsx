import React from 'react';
import { View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MiniPlayer } from '@/features/player/miniPlayer/components/orchestrators/MiniPlayer';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';

/** The mini-player is part of the bottom tab bar; beside the side bar of wide screens, AppNavigator docks it below. */
export function AppTabBar(props: BottomTabBarProps) {
	const { isWide } = useBreakpoint();

	if (isWide) return <BottomTabBar {...props} />;

	return (
		<View>
			<MiniPlayer />
			<BottomTabBar {...props} />
		</View>
	);
}

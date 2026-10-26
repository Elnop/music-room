import React from 'react';
import { View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MiniPlayer } from '@/features/player/miniPlayer/components/orchestrators/MiniPlayer';

/** The mini-player is part of the tab bar, so every tab screen ends above it on any device. */
export function AppTabBar(props: BottomTabBarProps) {
	return (
		<View>
			<MiniPlayer />
			<BottomTabBar {...props} />
		</View>
	);
}

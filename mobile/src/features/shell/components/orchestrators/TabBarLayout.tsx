import React from 'react';
import { View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SIDEBAR_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { SidebarAccountContainer } from '@/features/shell/components/orchestrators/SidebarAccountContainer';
import { SidebarFrame } from '@/features/shell/components/presenters/SidebarFrame';

type TabBarLayoutProps = BottomTabBarProps & {
	miniPlayer: React.ReactNode;
};

export function TabBarLayout({ miniPlayer, ...props }: TabBarLayoutProps) {
	const { breakpoint, isDesktop } = useBreakpoint();
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
		<SidebarFrame width={SIDEBAR_WIDTH[breakpoint]} topInset={insets.top} isDesktop={isDesktop}>
			<BottomTabBar {...props} />
			{isDesktop && (
				<SidebarAccountContainer
					active={props.state.routes[props.state.index].name === 'ProfileTab'}
					onPress={() => props.navigation.navigate('ProfileTab')}
				/>
			)}
		</SidebarFrame>
	);
}

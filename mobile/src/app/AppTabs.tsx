import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { PlaylistsNavigator } from '@/app/stacks/PlaylistsStack';
import { ProfileNavigator } from '@/app/stacks/ProfileStack';
import { SearchNavigator } from '@/app/stacks/SearchStack';
import { FriendsNavigator } from '@/app/stacks/FriendsStack';
import type { FriendsStackParamList } from '@/app/stacks/FriendsStack';
import { MiniPlayerContainer } from '@/features/playback/features/mini-player/components/MiniPlayerContainer';
import { TabBarLayout } from '@/features/shell/components/orchestrators/TabBarLayout';
import { useTabOptions } from '@/features/shell/hooks/useTabOptions';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import type { ProfileStackParamList } from '@/features/user/features/profile/types';

export type AppTabsParamList = {
	HomeTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	PlaylistsTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	SearchTab: undefined;
	FriendsTab: NavigatorScreenParams<FriendsStackParamList> | undefined;
	ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

function tabOptions(title: string) {
	return { title, tabBarAccessibilityLabel: title, headerShown: false };
}

function renderTabBar(props: BottomTabBarProps) {
	return <TabBarLayout {...props} miniPlayer={<MiniPlayerContainer />} />;
}

export function AppTabs() {
	const { screenOptions, hiddenOnDesktop } = useTabOptions();

	return (
		<Tab.Navigator tabBar={renderTabBar} screenOptions={screenOptions}>
			<Tab.Screen name="HomeTab" options={tabOptions('Accueil')}>
				{() => <PlaylistsNavigator initialRouteName="Home" />}
			</Tab.Screen>
			<Tab.Screen name="PlaylistsTab" options={tabOptions('Playlists')}>
				{() => <PlaylistsNavigator initialRouteName="Playlists" />}
			</Tab.Screen>
			<Tab.Screen name="SearchTab" component={SearchNavigator} options={tabOptions('Recherche')} />
			<Tab.Screen name="FriendsTab" component={FriendsNavigator} options={tabOptions('Amis')} />
			<Tab.Screen
				name="ProfileTab"
				component={ProfileNavigator}
				options={{ ...tabOptions('Profil'), ...hiddenOnDesktop }}
			/>
		</Tab.Navigator>
	);
}

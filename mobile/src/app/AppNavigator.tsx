import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { PlaylistsNavigator } from '@/app/stacks/PlaylistsStack';
import { TrackActionsSheet } from '@/app/TrackActionsSheet';
import { QueueSheet } from '@/app/QueueSheet';
import { KeyboardShortcuts } from '@/app/KeyboardShortcuts';
import { ProfileNavigator } from '@/app/stacks/ProfileStack';
import { SearchNavigator } from '@/app/stacks/SearchStack';
import { FriendsNavigator } from '@/app/stacks/FriendsStack';
import type { FriendsStackParamList } from '@/app/stacks/FriendsStack';
import { DevicePickerSheetContainer } from '@/features/playback/features/control-delegation/features/device-picker/components/DevicePickerSheetContainer';
import { PlayerModalContainer } from '@/features/playback/features/player-modal/components/orchestrators/PlayerModalContainer';
import { PlayerErrorToastContainer } from '@/features/playback/features/player-modal/components/orchestrators/PlayerErrorToastContainer';
import { PlayerProvider } from '@/features/playback/components/PlayerProvider';
import { useQueueSync } from '@/features/playback/hooks/useQueueSync';
import { useRemoteTarget } from '@/features/playback/hooks/useRemoteTarget';
import { MiniPlayerContainer } from '@/features/playback/features/mini-player/components/MiniPlayerContainer';
import { PlayerBarContainer } from '@/features/playback/features/player-bar/components/PlayerBarContainer';
import { NowPlayingPanelContainer } from '@/features/playback/features/now-playing-panel/components/NowPlayingPanelContainer';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import { useEventsSync } from '@/features/events/useEventsSync';
import { AppFrameLayout } from '@/features/shell/components/orchestrators/AppFrameLayout';
import { TabBarLayout } from '@/features/shell/components/orchestrators/TabBarLayout';
import { PanelOpenContainer } from '@/features/shell/components/orchestrators/PanelOpenContainer';
import { useTabOptions } from '@/features/shell/hooks/useTabOptions';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import type { PlaylistStackParamList } from '@/features/playlists/shared/playlist/lib/types';
import type { ProfileStackParamList } from '@/features/user/features/profile/types';

export type AppTabsParamList = {
	HomeTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	PlaylistsTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	SearchTab: undefined;
	FriendsTab: NavigatorScreenParams<FriendsStackParamList> | undefined;
	ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type { FriendsStackParamList } from '@/app/stacks/FriendsStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

const PLAYER_SHEETS: PlayerSheets = {
	QueueModal: QueueSheet,
	DevicePicker: DevicePickerSheetContainer,
};

export function AppNavigator() {
	const panelOpen = useNowPlayingPanelStore(state => state.isOpen);
	const { screenOptions, hiddenOnDesktop } = useTabOptions();
	useQueueSync();
	useEventsSync();
	useRemoteTarget();

	return (
		<PlayerProvider>
			<AppFrameLayout
				panel={
					panelOpen && (
						<NowPlayingPanelContainer {...PLAYER_SHEETS} TrackActionsSheet={TrackActionsSheet} />
					)
				}
				playerBar={<PlayerBarContainer {...PLAYER_SHEETS} />}
				miniPlayer={<MiniPlayerContainer />}
				overlays={
					<>
						<PlayerModalContainer {...PLAYER_SHEETS} />
						<PlayerErrorToastContainer />
						{Platform.OS === 'web' && <KeyboardShortcuts />}
					</>
				}
			>
				<PanelOpenContainer open={panelOpen}>
					<Tab.Navigator
						tabBar={props => <TabBarLayout {...props} miniPlayer={<MiniPlayerContainer />} />}
						screenOptions={screenOptions}
					>
						<Tab.Screen
							name="HomeTab"
							options={{
								title: 'Accueil',
								tabBarAccessibilityLabel: 'Accueil',
								headerShown: false,
							}}
						>
							{() => <PlaylistsNavigator initialRouteName="Home" />}
						</Tab.Screen>
						<Tab.Screen
							name="PlaylistsTab"
							options={{
								title: 'Playlists',
								tabBarAccessibilityLabel: 'Playlists',
								headerShown: false,
							}}
						>
							{() => <PlaylistsNavigator initialRouteName="Playlists" />}
						</Tab.Screen>
						<Tab.Screen
							name="SearchTab"
							component={SearchNavigator}
							options={{
								title: 'Recherche',
								tabBarAccessibilityLabel: 'Recherche',
								headerShown: false,
							}}
						/>
						<Tab.Screen
							name="FriendsTab"
							component={FriendsNavigator}
							options={{ title: 'Amis', tabBarAccessibilityLabel: 'Amis', headerShown: false }}
						/>
						<Tab.Screen
							name="ProfileTab"
							component={ProfileNavigator}
							options={{
								title: 'Profil',
								tabBarAccessibilityLabel: 'Profil',
								headerShown: false,
								...hiddenOnDesktop,
							}}
						/>
					</Tab.Navigator>
				</PanelOpenContainer>
			</AppFrameLayout>
		</PlayerProvider>
	);
}

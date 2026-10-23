/**
 * Main App Navigator
 *
 * This file orchestrates the bottom tab navigation for authenticated users.
 * Individual feature stacks are defined in navigation/stacks/ to avoid merge conflicts.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

// Import feature stacks
import { PlaylistsNavigator } from '@/navigation/stacks/PlaylistsStack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import { registerPlayback } from '@/navigation/playbackBridge';
import { ProfileNavigator } from '@/navigation/stacks/ProfileStack';
import { SearchNavigator } from '@/navigation/stacks/SearchStack';
import { FriendsNavigator, type FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

// Player components
import { MiniPlayer } from '@/features/player/components/miniPlayer/components/orchestrators/MiniPlayer';
import { PlayerModal } from '@/features/player/components/modal/components/orchestrators/PlayerModal';
import { PlayerErrorToast } from '@/features/player/components/feedback/PlayerErrorToast';
import { PlayerProvider } from '@/features/player/context/PlayerProvider';
import { useQueueSync } from '@/features/queue/hooks/useQueueSync';
import { useRemoteTarget } from '@/features/queue/hooks/useRemoteTarget';
import { useConnectionStatus } from '@/shared/hooks/useConnectionStatus';
import { ConnectionBanner } from '@/shared/components/feedback/ConnectionBanner';

// Tab navigation types
// Playlists and Friends take nested params: zumik:// share links open their screens (#321).
export type AppTabsParamList = {
	PlaylistsTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	SearchTab: undefined;
	FriendsTab: NavigatorScreenParams<FriendsStackParamList> | undefined;
	ProfileTab: undefined;
};

// Re-export stack param lists for type safety
export type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Before any screen renders: the playlists feature plays through it.
registerPlayback();

// Icon mapping for tabs
const TAB_ICONS: Record<
	string,
	{ active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
	PlaylistsTab: { active: 'musical-notes', inactive: 'musical-notes-outline' },
	SearchTab: { active: 'search', inactive: 'search-outline' },
	FriendsTab: { active: 'people', inactive: 'people-outline' },
	ProfileTab: { active: 'person', inactive: 'person-outline' },
};

export function AppNavigator() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	useQueueSync();
	useRemoteTarget();
	const connectionStatus = useConnectionStatus();
	// While the banner covers the status bar, the screens below it must not add
	// the status bar inset again (react-navigation headers read this context).
	const navigatorInsets = React.useMemo(
		() => (connectionStatus ? { ...insets, top: 0 } : insets),
		[connectionStatus, insets]
	);

	return (
		<PlayerProvider>
			<View style={styles.container}>
				<ConnectionBanner status={connectionStatus} topInset={insets.top} />

				<SafeAreaInsetsContext.Provider value={navigatorInsets}>
					<Tab.Navigator
						screenOptions={({ route }) => ({
							tabBarActiveTintColor: theme.colors.primary,
							tabBarInactiveTintColor: theme.colors.textSecondary,
							tabBarStyle: styles.tabBar,
							tabBarLabelStyle: styles.tabLabel,
							headerStyle: {
								backgroundColor: theme.colors.background,
							},
							headerTintColor: theme.colors.text,
							headerShadowVisible: false,
							headerTitleStyle: {
								fontWeight: theme.typography.weights.bold,
							},
							tabBarIcon: ({ focused, color }) => {
								const icons = TAB_ICONS[route.name];
								const iconName = focused ? icons.active : icons.inactive;
								return (
									<View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
										<Ionicons name={iconName} size={20} color={focused ? '#FFFFFF' : color} />
									</View>
								);
							},
						})}
					>
						<Tab.Screen
							name="PlaylistsTab"
							component={PlaylistsNavigator}
							options={{
								title: 'Playlists',
								tabBarAccessibilityLabel: 'Playlists',
								headerShown: false,
							}}
						/>
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
							options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil', headerShown: false }}
						/>
					</Tab.Navigator>
				</SafeAreaInsetsContext.Provider>

				{/* Mini Player - appears above tab bar */}
				<MiniPlayer />

				{/* Full Player Modal */}
				<PlayerModal />

				{/* Error Toast - appears center screen when track is unavailable */}
				<PlayerErrorToast />
			</View>
		</PlayerProvider>
	);
}

const createStyles = (theme: Theme, bottomInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
		},
		tabBar: {
			height: 70 + bottomInset,
			paddingTop: 10,
			paddingBottom: bottomInset + 10,
			backgroundColor: theme.colors.background,
			borderTopWidth: 0,
			elevation: 0,
		},
		iconContainer: {
			width: 56,
			height: 30,
			borderRadius: 15,
			justifyContent: 'center',
			alignItems: 'center',
		},
		tabLabel: {
			fontSize: 11,
			marginTop: 2,
		},
		iconContainerActive: {
			backgroundColor: theme.colors.primary,
		},
	});

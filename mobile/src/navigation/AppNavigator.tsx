/**
 * Main App Navigator
 *
 * This file orchestrates the bottom tab navigation for authenticated users.
 * Individual feature stacks are defined in navigation/stacks/ to avoid merge conflicts.
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@/themes/types';

// Import feature stacks
import { PlaylistsNavigator } from '@/navigation/stacks/PlaylistsStack';
import { ProfileNavigator } from '@/navigation/stacks/ProfileStack';
import { SearchNavigator } from '@/navigation/stacks/SearchStack';
import { FriendsNavigator } from '@/navigation/stacks/FriendsStack';

// Player components
import { MiniPlayer } from '@/components/player/MiniPlayer';
import { PlayerModal } from '@/components/player/PlayerModal';
import { PlayerErrorToast } from '@/components/player/PlayerErrorToast';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { useQueueSync } from '@/hooks/useQueueSync';

// Tab navigation types
export type AppTabsParamList = {
	PlaylistsTab: undefined;
	SearchTab: undefined;
	FriendsTab: undefined;
	ProfileTab: undefined;
};

// Re-export stack param lists for type safety
export type { PlaylistStackParamList } from '@/navigation/stacks/PlaylistsStack';
export type { ProfileStackParamList } from '@/navigation/stacks/ProfileStack';
export type { SearchStackParamList } from '@/navigation/stacks/SearchStack';
export type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

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

	return (
		<PlayerProvider>
			<View style={styles.container}>
				<Tab.Navigator
					screenOptions={({ route }) => ({
						tabBarActiveTintColor: theme.colors.primary,
						tabBarInactiveTintColor: theme.colors.textSecondary,
						tabBarStyle: styles.tabBar,
						tabBarShowLabel: false,
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
									<Ionicons name={iconName} size={22} color={focused ? '#FFFFFF' : color} />
								</View>
							);
						},
					})}
				>
					<Tab.Screen
						name="PlaylistsTab"
						component={PlaylistsNavigator}
						options={{ title: 'Playlists', headerShown: false }}
					/>
					<Tab.Screen
						name="SearchTab"
						component={SearchNavigator}
						options={{ title: 'Search', headerShown: false }}
					/>
					<Tab.Screen
						name="FriendsTab"
						component={FriendsNavigator}
						options={{ title: 'Friends', headerShown: false }}
					/>
					<Tab.Screen
						name="ProfileTab"
						component={ProfileNavigator}
						options={{ title: 'Profile', headerShown: false }}
					/>
				</Tab.Navigator>

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
			width: 44,
			height: 44,
			borderRadius: 22,
			justifyContent: 'center',
			alignItems: 'center',
		},
		iconContainerActive: {
			backgroundColor: theme.colors.primary,
		},
	});

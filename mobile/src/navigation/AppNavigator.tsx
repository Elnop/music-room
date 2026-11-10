import React from 'react';
import {
	createBottomTabNavigator,
	type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';

import { PlaylistsNavigator } from '@/navigation/stacks/PlaylistsStack';
import type { PlaylistStackParamList } from '@/features/playlists/types';
import type { ProfileStackParamList } from '@/features/profile/types';
import { registerPlayback } from '@/navigation/playbackBridge';
import { registerMusicControl } from '@/navigation/musicControlBridge';
import { ProfileNavigator } from '@/navigation/stacks/ProfileStack';
import { SearchNavigator } from '@/navigation/stacks/SearchStack';
import { FriendsNavigator, type FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

import { AppTabBar } from './AppTabBar';
import { PlayerModal } from '@/features/player/modal/components/orchestrators/PlayerModal';
import { PlayerErrorToast } from '@/features/player/modal/components/orchestrators/PlayerErrorToast';
import { PlayerProvider } from '@/features/player/context/PlayerProvider';
import { useQueueSync } from '@/features/queue/hooks/useQueueSync';
import { useEventsSync } from '@/features/events/hooks/useEventsSync';
import { useRemoteTarget } from '@/features/queue/hooks/useRemoteTarget';
import { useConnectionStatus } from '@/shared/hooks/useConnectionStatus';
import { ConnectionBanner } from '@/shared/components/feedback/ConnectionBanner';
import { TAB_BAR_HEIGHT } from '@/shared/constants/layout';
import { useBreakpoint, type Breakpoint } from '@/shared/hooks/useBreakpoint';
import { MiniPlayer } from '@/features/player/miniPlayer/components/orchestrators/MiniPlayer';
import { PlayerBar } from '@/features/player/playerBar/components/orchestrators/PlayerBar';
import { NowPlayingPanel } from '@/features/player/nowPlayingPanel/components/orchestrators/NowPlayingPanel';
import { useNowPlayingPanelStore } from '@/shared/stores/nowPlayingPanelStore';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { KeyboardShortcuts } from './KeyboardShortcuts';

// Playlists and Friends take nested params: zumik:// share links open their screens;
// Profile's let a playlist open Settings.
export type AppTabsParamList = {
	HomeTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	PlaylistsTab: NavigatorScreenParams<PlaylistStackParamList> | undefined;
	SearchTab: undefined;
	FriendsTab: NavigatorScreenParams<FriendsStackParamList> | undefined;
	ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

const Tab = createBottomTabNavigator<AppTabsParamList>();

// Before any screen renders: the playlists feature plays through it.
registerPlayback();
registerMusicControl();

const TAB_ICONS: Record<string, PixelSpriteName> = {
	HomeTab: 'home',
	PlaylistsTab: 'tape',
	SearchTab: 'search',
	FriendsTab: 'crew',
	ProfileTab: 'me',
};

/** Wide screens move the tabs to a side bar framed by AppTabBar: an icon rail on a tablet, icons and labels on desktop. */
const sidebarOptions = (
	breakpoint: Exclude<Breakpoint, 'phone'>,
	theme: Theme
): BottomTabNavigationOptions => ({
	tabBarPosition: 'left',
	tabBarVariant: breakpoint === 'tablet' ? 'material' : 'uikit',
	tabBarShowLabel: true,
	tabBarLabelPosition: breakpoint === 'tablet' ? 'below-icon' : 'beside-icon',
	// The library's defaults put a primary label on a primary fill.
	tabBarActiveTintColor: theme.colors.text,
	tabBarActiveBackgroundColor: theme.colors.surfaceAlt,
	tabBarLabelStyle:
		breakpoint === 'tablet'
			? { fontSize: theme.typography.sizes.sm, marginTop: theme.spacing.xs }
			: {
					fontSize: theme.typography.sizes.md,
					fontFamily: theme.typography.families.semibold,
					marginStart: theme.spacing.md,
				},
	tabBarStyle: {
		flex: 1,
		// Overrides the side bar's 360 px minimum width.
		minWidth: 0,
		paddingTop: theme.spacing.md,
		paddingStart: breakpoint === 'tablet' ? theme.spacing.xs : theme.spacing.sm,
		paddingEnd: breakpoint === 'tablet' ? theme.spacing.xs : theme.spacing.sm,
		backgroundColor: 'transparent',
		borderRightWidth: 0,
	},
});

export function AppNavigator() {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { breakpoint } = useBreakpoint();
	const panelOpen = useNowPlayingPanelStore(state => state.isOpen);
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const sidebar = React.useMemo(
		() => (breakpoint === 'phone' ? null : sidebarOptions(breakpoint, theme)),
		[breakpoint, theme]
	);
	useQueueSync();
	useEventsSync();
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

				{/* The same tree on every width: a resized window keeps its navigation state. */}
				<View style={styles.body}>
					<SafeAreaInsetsContext.Provider value={navigatorInsets}>
						<Tab.Navigator
							tabBar={props => <AppTabBar {...props} />}
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
									fontFamily: theme.typography.families.bold,
								},
								...sidebar,
								// A pixel square under the active tab, in its tint.
								tabBarIcon: ({ focused, color }) => (
									<View style={styles.tabIcon}>
										<PixelIcon name={TAB_ICONS[route.name]} color={color} />
										<View style={[styles.tabDot, focused && { backgroundColor: color }]} />
									</View>
								),
							})}
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
									// The desktop side bar reaches the profile through the account at its foot.
									...(breakpoint === 'desktop' ? { tabBarItemStyle: { display: 'none' } } : null),
								}}
							/>
						</Tab.Navigator>
					</SafeAreaInsetsContext.Provider>
					{breakpoint === 'desktop' && panelOpen && <NowPlayingPanel />}
				</View>

				{sidebar && (
					<View style={[styles.playerBar, { borderTopColor: separator }]}>
						{breakpoint === 'desktop' ? <PlayerBar /> : <MiniPlayer />}
					</View>
				)}

				<PlayerModal />
				<PlayerErrorToast />
				{Platform.OS === 'web' && <KeyboardShortcuts />}
			</View>
		</PlayerProvider>
	);
}

const createStyles = (theme: Theme, bottomInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
		},
		// The desktop's now playing panel docks to the right of the screens, above the player bar.
		body: {
			flex: 1,
			flexDirection: 'row',
		},
		tabBar: {
			height: TAB_BAR_HEIGHT + bottomInset,
			paddingTop: 10,
			paddingBottom: bottomInset + 10,
			backgroundColor: theme.colors.background,
			borderTopWidth: theme.borders.thick,
			borderTopColor: theme.colors.border,
			elevation: 0,
		},
		tabIcon: { alignItems: 'center', gap: theme.spacing.xs },
		tabDot: { width: 6, height: 6 },
		playerBar: {
			paddingBottom: bottomInset,
			borderTopWidth: 1,
			backgroundColor: theme.colors.background,
		},
	});

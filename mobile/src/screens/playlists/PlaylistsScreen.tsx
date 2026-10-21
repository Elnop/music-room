import React, { useCallback, useState, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
import { playlistApi } from '@api/playlistApi';
import { friendsApi, type FriendProfile } from '@/services/friendsApi';
import { PlaylistGridCard } from '@components/playlist/PlaylistGridCard';
import { FriendPlaylistSection } from '@components/playlist/FriendPlaylistSection';
import { EmptyState } from '@components/common/EmptyState';
import { PlaylistCardSkeleton, SkeletonBlock, SkeletonList } from '@components/common/Skeleton';
import { showError } from '@utils/toast';
import { apiErrorMessage } from '@utils/apiErrorMessage';
import type { Playlist } from '@/types/playlist.types';
import { logger } from '@/utils/logger';

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: undefined;
	SearchTracks: { playlistId: string };
};

type PlaylistsScreenNavigationProp = NativeStackNavigationProp<PlaylistStackParamList, 'Playlists'>;

interface PlaylistsScreenProps {
	navigation: PlaylistsScreenNavigationProp;
}

// Same width as the cards of FriendPlaylistSection's carousel.
function FriendCardSkeleton() {
	return <PlaylistCardSkeleton width={140} />;
}

interface FriendPlaylistData {
	friend: FriendProfile;
	playlists: Playlist[];
}

export function PlaylistsScreen({ navigation }: PlaylistsScreenProps) {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { user, accessToken } = useAuthStore();
	const { playlists, isLoading, fetchPlaylists } = usePlaylistStore();

	// État pour les playlists des amis
	const [friendsPlaylists, setFriendsPlaylists] = useState<FriendPlaylistData[]>([]);
	const [isFriendsLoading, setIsFriendsLoading] = useState(false);

	// État pour les playlists publiques
	const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
	const [isPublicLoading, setIsPublicLoading] = useState(false);

	// État pour le pull-to-refresh manuel
	const [isRefreshing, setIsRefreshing] = useState(false);

	// État pour les sections collapsibles
	const [isMyPlaylistsOpen, setIsMyPlaylistsOpen] = useState(true);
	const [isPublicPlaylistsOpen, setIsPublicPlaylistsOpen] = useState(true);

	// Séparer mes playlists (celles dont je suis le propriétaire)
	const myPlaylists = playlists.filter(p => user && p.ownerId === user.id);

	const handleCreatePress = useCallback(() => {
		navigation.navigate('CreatePlaylist');
	}, [navigation]);

	// Configure the "+" button in native header
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<Pressable
					onPress={handleCreatePress}
					style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
				>
					<Ionicons name="add" size={28} color={theme.colors.text} />
				</Pressable>
			),
		});
	}, [navigation, handleCreatePress, theme.colors.text]);

	// Charger les playlists des amis (stale-while-revalidate)
	const loadFriendsPlaylists = useCallback(async () => {
		if (!accessToken) return;

		// Only show loading if we have no cached data
		if (friendsPlaylists.length === 0) {
			setIsFriendsLoading(true);
		}
		try {
			const friends = await friendsApi.getFriends(accessToken);

			// Charger les playlists de chaque ami en parallèle
			const friendsPlaylistsData = await Promise.all(
				friends.map(async friend => {
					try {
						const friendPlaylists = await playlistApi.fetchUserPublicPlaylists(friend.id);
						return { friend, playlists: friendPlaylists };
					} catch {
						return { friend, playlists: [] };
					}
				})
			);

			// Filtrer les amis sans playlists
			setFriendsPlaylists(friendsPlaylistsData.filter(fp => fp.playlists.length > 0));
		} catch (error) {
			logger.error('[PlaylistsScreen] Failed to load friends playlists:', error);
		} finally {
			setIsFriendsLoading(false);
		}
	}, [accessToken, friendsPlaylists.length]);

	// Charger les playlists publiques (stale-while-revalidate)
	const loadPublicPlaylists = useCallback(async () => {
		// Only show loading if we have no cached data
		if (publicPlaylists.length === 0) {
			setIsPublicLoading(true);
		}
		try {
			const fetchedPlaylists = await playlistApi.fetchPublicPlaylists();
			setPublicPlaylists(fetchedPlaylists);
		} catch (error) {
			logger.error('[PlaylistsScreen] Failed to load public playlists:', error);
		} finally {
			setIsPublicLoading(false);
		}
	}, [publicPlaylists.length]);

	// Refresh silencieux au focus
	useFocusEffect(
		useCallback(() => {
			if (user) {
				fetchPlaylists(user.id);
				loadFriendsPlaylists();
				loadPublicPlaylists();
			}
		}, [user, fetchPlaylists, loadFriendsPlaylists, loadPublicPlaylists])
	);

	// Pull-to-refresh manuel
	const handleRefresh = async () => {
		if (user) {
			setIsRefreshing(true);
			try {
				await Promise.all([fetchPlaylists(user.id), loadFriendsPlaylists(), loadPublicPlaylists()]);
			} catch (error) {
				logger.error('[PlaylistsScreen] Refresh failed:', error);
				showError(apiErrorMessage(error, 'Impossible de rafraîchir les playlists'));
			} finally {
				setIsRefreshing(false);
			}
		}
	};

	// The friends tab lives in the parent tab navigator.
	const handleFindFriends = useCallback(() => {
		navigation.getParent()?.navigate('FriendsTab');
	}, [navigation]);

	const handlePlaylistPress = (id: string) => {
		navigation.navigate('PlaylistDetail', { id });
	};

	if (isLoading && playlists.length === 0) {
		return (
			<View style={styles.container}>
				<SkeletonList
					count={4}
					row={PlaylistCardSkeleton}
					style={[styles.list, styles.myPlaylistsGrid]}
					header={
						<View style={styles.skeletonHeader}>
							<SkeletonBlock width={180} height={18} style={styles.skeletonTitle} />
							<View style={[styles.friendsSkeleton, styles.skeletonCarousel]}>
								<FriendCardSkeleton />
								<FriendCardSkeleton />
								<FriendCardSkeleton />
							</View>
							<SkeletonBlock width={140} height={18} style={styles.skeletonTitle} />
						</View>
					}
				/>
			</View>
		);
	}

	const renderHeader = () => (
		<View>
			{/* Section: Playlists des amis */}
			<View style={styles.section}>
				<View style={styles.sectionHeader}>
					<View style={styles.sectionTitleRow}>
						<Ionicons
							name="people-outline"
							size={18}
							color={theme.colors.textSecondary}
							style={styles.sectionIcon}
						/>
						<Text style={styles.sectionTitle}>Playlists de vos amis</Text>
					</View>
					{friendsPlaylists.length > 0 && (
						<Text style={styles.sectionCount}>
							{friendsPlaylists.reduce((acc, fp) => acc + fp.playlists.length, 0)}
						</Text>
					)}
				</View>

				{isFriendsLoading && friendsPlaylists.length === 0 ? (
					<SkeletonList count={3} row={FriendCardSkeleton} style={styles.friendsSkeleton} />
				) : (
					<FriendPlaylistSection
						friendsPlaylists={friendsPlaylists}
						onPlaylistPress={handlePlaylistPress}
						onFindFriends={handleFindFriends}
					/>
				)}
			</View>

			{/* Spacer */}
			<View style={styles.sectionSpacer} />

			{/* Section: Mes playlists - Collapsible */}
			<View style={styles.section}>
				<Pressable
					style={styles.sectionHeader}
					onPress={() => setIsMyPlaylistsOpen(!isMyPlaylistsOpen)}
				>
					<View style={styles.sectionTitleRow}>
						<Ionicons
							name="library-outline"
							size={18}
							color={theme.colors.textSecondary}
							style={styles.sectionIcon}
						/>
						<Text style={styles.sectionTitle}>Vos playlists</Text>
						{myPlaylists.length > 0 && (
							<Text style={styles.sectionCountInline}>{myPlaylists.length}</Text>
						)}
					</View>
					<Ionicons
						name={isMyPlaylistsOpen ? 'chevron-down' : 'chevron-forward'}
						size={20}
						color={theme.colors.textSecondary}
					/>
				</Pressable>

				{isMyPlaylistsOpen &&
					(myPlaylists.length > 0 ? (
						<View style={styles.myPlaylistsGrid}>
							{myPlaylists.map(playlist => (
								<PlaylistGridCard
									key={playlist.id}
									playlist={playlist}
									onPress={() => handlePlaylistPress(playlist.id)}
								/>
							))}
						</View>
					) : (
						<EmptyState
							icon="musical-notes-outline"
							message="Aucune playlist pour l'instant. Créez votre première playlist !"
							action={{ label: 'Créer une playlist', onPress: handleCreatePress }}
						/>
					))}
			</View>
		</View>
	);

	const renderFooter = () => (
		<View>
			{/* Spacer */}
			<View style={styles.sectionSpacer} />

			{/* Section: Playlists publiques - Collapsible */}
			<View style={styles.section}>
				<Pressable
					style={styles.sectionHeader}
					onPress={() => setIsPublicPlaylistsOpen(!isPublicPlaylistsOpen)}
				>
					<View style={styles.sectionTitleRow}>
						<Ionicons
							name="globe-outline"
							size={18}
							color={theme.colors.textSecondary}
							style={styles.sectionIcon}
						/>
						<Text style={styles.sectionTitle}>Playlists publiques</Text>
						{publicPlaylists.length > 0 && (
							<Text style={styles.sectionCountInline}>{publicPlaylists.length}</Text>
						)}
					</View>
					<Ionicons
						name={isPublicPlaylistsOpen ? 'chevron-down' : 'chevron-forward'}
						size={20}
						color={theme.colors.textSecondary}
					/>
				</Pressable>

				{isPublicPlaylistsOpen &&
					(isPublicLoading && publicPlaylists.length === 0 ? (
						<SkeletonList count={4} row={PlaylistCardSkeleton} style={styles.publicPlaylistsGrid} />
					) : publicPlaylists.length > 0 ? (
						<View style={styles.publicPlaylistsGrid}>
							{publicPlaylists.map(playlist => (
								<PlaylistGridCard
									key={playlist.id}
									playlist={playlist}
									onPress={() => handlePlaylistPress(playlist.id)}
									showOwner
								/>
							))}
						</View>
					) : (
						<EmptyState icon="globe-outline" message="Aucune playlist publique disponible" />
					))}
			</View>
		</View>
	);

	return (
		<View style={styles.container}>
			<FlatList
				data={[]}
				keyExtractor={() => 'dummy'}
				ListHeaderComponent={renderHeader}
				ListFooterComponent={renderFooter}
				renderItem={() => null}
				contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.md,
		},
		section: {
			marginBottom: theme.spacing.sm,
		},
		sectionHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.md,
		},
		sectionTitleRow: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		sectionIcon: {
			marginRight: theme.spacing.sm,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		sectionCount: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		sectionCountInline: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.sm,
		},
		sectionSpacer: {
			height: theme.spacing.md,
		},
		// Friends section then "Vos playlists" title, above the grid's cards.
		skeletonHeader: {
			width: '100%',
		},
		skeletonTitle: {
			marginBottom: theme.spacing.md,
		},
		skeletonCarousel: {
			paddingHorizontal: 0,
			marginBottom: theme.spacing.md * 2 + theme.spacing.sm,
		},
		friendsSkeleton: {
			flexDirection: 'row',
			overflow: 'hidden',
			paddingHorizontal: theme.spacing.md,
			gap: 12,
		},
		myPlaylistsGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.md,
			gap: 16,
		},
		publicPlaylistsGrid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.md,
			gap: 16,
		},
	});

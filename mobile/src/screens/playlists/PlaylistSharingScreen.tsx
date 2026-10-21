import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedSwitch } from '@components/common/ThemedSwitch';
import { apiErrorMessage } from '@utils/apiErrorMessage';
import { EmptyState } from '@components/common/EmptyState';
import { showError, showWarning, showSuccess } from '@utils/toast';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { debounce } from '@/utils/debounce';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@store/authStore';
import { usePlaylistStore } from '@store/playlistStore';
import { profileApi } from '@services/profileApi';
import { playlistApi, ViewerProfile } from '@api/playlistApi';
import { SearchBar } from '@components/common/SearchBar';
import { Avatar } from '@components/common/Avatar';
import { SwipeableUserItem } from '@components/common/SwipeableUserItem';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import type { UserProfile } from '@/types/user.types';

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	PlaylistSharing: { playlistId: string };
	CreatePlaylist: undefined;
	SearchTracks: { playlistId: string };
};

type PlaylistSharingScreenNavigationProp = NativeStackNavigationProp<
	PlaylistStackParamList,
	'PlaylistSharing'
>;

type PlaylistSharingScreenRouteProp = RouteProp<PlaylistStackParamList, 'PlaylistSharing'>;

interface PlaylistSharingScreenProps {
	navigation: PlaylistSharingScreenNavigationProp;
	route: PlaylistSharingScreenRouteProp;
}

interface Member {
	id: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	canEdit: boolean;
}

const toMember = (user: UserProfile | ViewerProfile, canEdit: boolean): Member => ({
	id: user.id,
	username: user.username,
	displayName: user.displayName,
	avatarUrl: user.avatarUrl,
	canEdit,
});

/**
 * Permission modes based on visibility + editMode:
 *
 * | visibility | editMode   | What this screen manages                    |
 * |------------|------------|---------------------------------------------|
 * | public     | open       | Info only - everyone can edit               |
 * | public     | restricted | Manage editors (collaborators)              |
 * | private    | open       | Manage access (viewers = can also edit)     |
 * | private    | restricted | Manage access (viewers) + editors (collabs) |
 */
export function PlaylistSharingScreen({ route }: PlaylistSharingScreenProps) {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { playlistId } = route.params;

	const { accessToken } = useAuthStore();
	const { currentPlaylist, fetchPlaylistById } = usePlaylistStore();

	const [members, setMembers] = useState<Member[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [processingUserId, setProcessingUserId] = useState<string | null>(null);
	const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

	const loadingRef = useRef(false);
	const { updatePlaylist } = usePlaylistStore();

	const isPrivate = currentPlaylist?.visibility === 'private';
	const isEditRestricted = currentPlaylist?.editMode === 'restricted';

	const showEditToggle = isPrivate && isEditRestricted;
	const isInfoOnly = !isPrivate && !isEditRestricted;

	const loadAllData = useCallback(async () => {
		if (!accessToken || loadingRef.current) return;

		loadingRef.current = true;
		setIsLoading(true);

		try {
			await fetchPlaylistById(playlistId);
		} catch (error) {
			console.error('[PlaylistSharing] Failed to fetch playlist:', error);
			showError(apiErrorMessage(error, 'Impossible de charger la playlist'));
			setIsLoading(false);
			loadingRef.current = false;
			return;
		}

		try {
			const viewersData = await playlistApi.getViewers(playlistId);
			const { currentPlaylist: updatedPlaylist } = usePlaylistStore.getState();

			if (!updatedPlaylist) {
				throw new Error('Playlist not found after fetch');
			}

			const editorIds = updatedPlaylist.collaboratorIds || [];
			let editorProfiles: ViewerProfile[] = [];

			if (editorIds.length > 0) {
				const profiles = await Promise.all(
					editorIds.map((id: string) => profileApi.getUserProfile(accessToken, id))
				);
				editorProfiles = profiles.map(p => ({
					id: p.id,
					username: p.username,
					displayName: p.displayName,
					avatarUrl: p.avatarUrl,
				}));
			}

			const allMembers: Member[] = [];
			const addedIds = new Set<string>();

			editorProfiles.forEach(e => {
				if (!addedIds.has(e.id)) {
					allMembers.push(toMember(e, true));
					addedIds.add(e.id);
				}
			});

			viewersData.forEach(v => {
				if (!addedIds.has(v.id)) {
					allMembers.push(toMember(v, false));
					addedIds.add(v.id);
				}
			});

			setMembers(allMembers);
		} catch (error) {
			console.error('[PlaylistSharing] Failed to load members:', error);
		} finally {
			setIsLoading(false);
			loadingRef.current = false;
		}
	}, [accessToken, playlistId, fetchPlaylistById]);

	useEffect(() => {
		loadAllData();
	}, [playlistId, loadAllData]);

	useFocusEffect(
		useCallback(() => {
			if (!loadingRef.current) {
				loadAllData();
			}
		}, [loadAllData])
	);

	const performSearch = useCallback(
		async (query: string) => {
			if (!query.trim() || !accessToken) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);

			try {
				const results = await profileApi.searchUsers(accessToken, query);
				const filteredResults = results.filter(user => {
					if (user.id === currentPlaylist?.ownerId) return false;
					if (members.some(m => m.id === user.id)) return false;
					return true;
				});
				setSearchResults(filteredResults);
			} catch (error) {
				console.error('[PlaylistSharing] Search failed:', error);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		},
		[accessToken, members, currentPlaylist?.ownerId]
	);

	const debouncedSearch = React.useMemo(
		() => debounce((query: string) => performSearch(query), 500),
		[performSearch]
	);

	useEffect(() => {
		return () => debouncedSearch.cancel();
	}, [debouncedSearch]);

	const handleSearchChange = (text: string) => {
		setSearchQuery(text);
		if (text.trim()) {
			debouncedSearch(text);
		} else {
			debouncedSearch.cancel();
			setSearchResults([]);
		}
	};

	const handleAddUser = async (user: UserProfile) => {
		if (processingUserId) return;

		const canEdit = !isEditRestricted;

		const newMember = toMember(user, canEdit);

		setMembers(prev => [...prev, newMember]);
		setSearchQuery('');
		setSearchResults([]);
		setProcessingUserId(user.id);

		try {
			if (isPrivate) {
				await playlistApi.addViewer(playlistId, user.id);
			} else {
				await playlistApi.addCollaborator(playlistId, user.id);
			}
		} catch (err) {
			setMembers(prev => prev.filter(m => m.id !== user.id));
			showError(apiErrorMessage(err, "Impossible d'ajouter l'utilisateur"));
		} finally {
			setProcessingUserId(null);
		}
	};

	const handleRemoveUser = async (userId: string) => {
		if (processingUserId) return;

		const member = members.find(m => m.id === userId);
		if (!member) return;

		// Swipe-to-delete: direct removal without confirmation
		const originalMembers = [...members];

		setMembers(prev => prev.filter(m => m.id !== userId));
		setProcessingUserId(userId);

		try {
			if (isPrivate) {
				if (member.canEdit) {
					await playlistApi.removeCollaborator(playlistId, userId);
				}
				try {
					await playlistApi.removeViewer(playlistId, userId);
				} catch (_error) {
					// Viewer may not exist, which is acceptable - ignore error
				}
			} else {
				await playlistApi.removeCollaborator(playlistId, userId);
			}
			showSuccess('Utilisateur retiré');
		} catch (error) {
			console.error('[PlaylistSharing] Remove failed:', error);
			setMembers(originalMembers);
			showError(apiErrorMessage(error, "Impossible de retirer l'utilisateur"));
		} finally {
			setProcessingUserId(null);
		}
	};

	const handleToggleVisibility = async () => {
		if (isUpdatingSettings || !currentPlaylist) return;

		const newVisibility = isPrivate ? 'public' : 'private';

		// If switching to public, warn about removing access restrictions
		if (isPrivate) {
			showWarning('Playlist publique : visible par tous');
		}
		await performVisibilityUpdate(newVisibility);
	};

	const performVisibilityUpdate = async (newVisibility: 'public' | 'private') => {
		setIsUpdatingSettings(true);
		try {
			await updatePlaylist(playlistId, { visibility: newVisibility });
			await fetchPlaylistById(playlistId);
		} catch (error) {
			console.error('[PlaylistSharing] Failed to update visibility:', error);
			showError(apiErrorMessage(error, 'Impossible de changer la visibilité'));
		} finally {
			setIsUpdatingSettings(false);
		}
	};

	const handleToggleEditMode = async () => {
		if (isUpdatingSettings || !currentPlaylist) return;

		const newEditMode = isEditRestricted ? 'open' : 'restricted';

		// If switching to open, warn about giving everyone edit access
		if (isEditRestricted) {
			const message = isPrivate
				? 'Tous les membres pourront éditer'
				: 'Tout le monde pourra éditer';
			showWarning(message);
		}
		await performEditModeUpdate(newEditMode);
	};

	const performEditModeUpdate = async (newEditMode: 'open' | 'restricted') => {
		setIsUpdatingSettings(true);
		try {
			await updatePlaylist(playlistId, { editMode: newEditMode });
			await fetchPlaylistById(playlistId);
		} catch (error) {
			console.error('[PlaylistSharing] Failed to update edit mode:', error);
			showError(apiErrorMessage(error, 'Impossible de changer le mode édition'));
		} finally {
			setIsUpdatingSettings(false);
		}
	};

	const handleToggleEdit = async (userId: string, currentCanEdit: boolean) => {
		if (processingUserId) return;

		const memberIndex = members.findIndex(m => m.id === userId);
		if (memberIndex === -1) return;

		const originalMembers = [...members];

		setMembers(prev => prev.map(m => (m.id === userId ? { ...m, canEdit: !currentCanEdit } : m)));
		setProcessingUserId(userId);

		try {
			if (currentCanEdit) {
				await playlistApi.removeCollaborator(playlistId, userId);
				try {
					await playlistApi.addViewer(playlistId, userId);
				} catch (_error) {
					// User may already be a viewer - ignore error
				}
			} else {
				await playlistApi.addCollaborator(playlistId, userId);
			}
		} catch (error) {
			console.error('[PlaylistSharing] Toggle failed:', error);
			setMembers(originalMembers);
			showError(apiErrorMessage(error, 'Impossible de changer les permissions'));
		} finally {
			setProcessingUserId(null);
		}
	};

	const renderSearchResultItem = ({ item }: { item: UserProfile }) => (
		<TouchableOpacity
			style={styles.userItem}
			onPress={() => handleAddUser(item)}
			activeOpacity={0.7}
			disabled={!!processingUserId}
		>
			<Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
			<View style={styles.userInfo}>
				<Text style={styles.username}>{item.username}</Text>
				{item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
			</View>
			<View style={styles.addButton}>
				<Ionicons name="add" size={24} color="#FFFFFF" />
			</View>
		</TouchableOpacity>
	);

	const renderMemberItem = ({ item }: { item: Member }) => {
		const isProcessing = processingUserId === item.id;
		const role = item.canEdit ? 'collaborator' : 'viewer';

		return (
			<SwipeableUserItem
				user={{
					id: item.id,
					username: item.username,
					display_name: item.displayName,
					avatar_url: item.avatarUrl,
				}}
				role={role}
				onRemove={handleRemoveUser}
			/>
		);
	};

	const renderSettingsSection = () => (
		<View style={styles.settingsSection}>
			<Text style={styles.settingsSectionTitle}>Paramètres</Text>

			{/* Visibility Toggle */}
			<View style={styles.settingItem}>
				<View style={styles.settingInfo}>
					<View style={styles.settingIconContainer}>
						<Ionicons
							name={isPrivate ? 'lock-closed' : 'globe'}
							size={20}
							color={theme.colors.primary}
						/>
					</View>
					<View style={styles.settingTextContainer}>
						<Text style={styles.settingLabel}>Visibilité</Text>
						<Text style={styles.settingDescription}>
							{isPrivate
								? 'Privée : visible uniquement par les invités'
								: 'Publique : visible par tous'}
						</Text>
					</View>
				</View>
				{isUpdatingSettings ? (
					<LoadingSpinner size="small" />
				) : (
					<ThemedSwitch value={isPrivate} onValueChange={handleToggleVisibility} />
				)}
			</View>

			{/* Edit Mode Toggle */}
			<View style={styles.settingItem}>
				<View style={styles.settingInfo}>
					<View style={styles.settingIconContainer}>
						<Ionicons
							name={isEditRestricted ? 'pencil' : 'create'}
							size={20}
							color={theme.colors.primary}
						/>
					</View>
					<View style={styles.settingTextContainer}>
						<Text style={styles.settingLabel}>Mode de modification</Text>
						<Text style={styles.settingDescription}>
							{isEditRestricted
								? 'Restreint : seuls les éditeurs peuvent modifier'
								: 'Ouvert : tout le monde peut modifier'}
						</Text>
					</View>
				</View>
				{isUpdatingSettings ? (
					<LoadingSpinner size="small" />
				) : (
					<ThemedSwitch value={isEditRestricted} onValueChange={handleToggleEditMode} />
				)}
			</View>
		</View>
	);

	const renderInfoCard = () => (
		<View style={styles.infoCard}>
			<Ionicons name="information-circle" size={28} color={theme.colors.primary} />
			<View style={styles.infoContent}>
				<Text style={styles.infoTitle}>Playlist ouverte</Text>
				<Text style={styles.infoText}>
					Cette playlist est publique : tout le monde peut ajouter ou retirer des titres.
				</Text>
			</View>
		</View>
	);

	const getHeaderContent = () => {
		if (isPrivate && isEditRestricted) {
			return {
				title: 'Accès et modification',
				subtitle: 'Gérez qui peut voir cette playlist et qui peut la modifier.',
			};
		}
		if (isPrivate && !isEditRestricted) {
			return {
				title: 'Accès',
				subtitle:
					'Gérez qui peut voir et modifier cette playlist privée. Tous les invités peuvent la modifier.',
			};
		}
		if (!isPrivate && isEditRestricted) {
			return {
				title: 'Éditeurs',
				subtitle: 'Gérez qui peut modifier cette playlist publique.',
			};
		}
		// public + open
		return {
			title: 'Playlist ouverte à tous',
			subtitle: 'Cette playlist est ouverte à tous.',
		};
	};

	const getSectionTitle = () => {
		if (isPrivate && isEditRestricted) {
			return `Personnes ayant accès (${members.length})`;
		}
		if (isPrivate && !isEditRestricted) {
			return `Invités (${members.length})`;
		}
		return `Éditeurs (${members.length})`;
	};

	const getEmptyMessage = () => {
		if (isPrivate) {
			return "Personne n'a encore accès à cette playlist";
		}
		return 'Aucun éditeur ajouté';
	};

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	const headerContent = getHeaderContent();

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: playerHeight + theme.spacing.xl },
				]}
			>
				<View style={styles.header}>
					<Text style={styles.title}>{headerContent.title}</Text>
					<Text style={styles.subtitle}>{headerContent.subtitle}</Text>
				</View>

				<View style={styles.content}>
					{/* Settings Section - Always visible */}
					{renderSettingsSection()}

					{isInfoOnly && renderInfoCard()}

					{!isInfoOnly && (
						<SearchBar
							value={searchQuery}
							onChangeText={handleSearchChange}
							placeholder="Rechercher un utilisateur…"
							style={styles.searchBar}
						/>
					)}

					{searchQuery.trim() && !isInfoOnly && (
						<View style={styles.searchResults}>
							<Text style={styles.sectionTitle}>Résultats</Text>
							{isSearching ? (
								<LoadingSpinner size="small" />
							) : searchResults.length > 0 ? (
								<FlatList
									data={searchResults}
									keyExtractor={item => item.id}
									renderItem={renderSearchResultItem}
									style={styles.resultsList}
									scrollEnabled={false}
								/>
							) : (
								<EmptyState
									icon="search-outline"
									style={styles.noResults}
									message="Aucun utilisateur trouvé"
								/>
							)}
						</View>
					)}

					{(!isInfoOnly || members.length > 0) && (
						<View style={styles.membersSection}>
							<Text style={styles.sectionTitle}>{getSectionTitle()}</Text>

							{members.length > 0 ? (
								<FlatList
									data={members}
									keyExtractor={item => item.id}
									renderItem={renderMemberItem}
									style={styles.membersList}
									scrollEnabled={false}
									extraData={processingUserId}
								/>
							) : (
								!isInfoOnly && (
									<EmptyState
										icon="people-outline"
										style={styles.noMembers}
										message={getEmptyMessage()}
									/>
								)
							)}
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		scrollContent: {
			flexGrow: 1,
		},
		header: {
			padding: theme.spacing.lg,
			borderBottomWidth: theme.borders.medium,
			borderBottomColor: theme.colors.border,
			backgroundColor: theme.colors.surface,
		},
		title: {
			fontSize: theme.typography.sizes.xl,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		subtitle: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		content: {
			flex: 1,
			padding: theme.spacing.lg,
		},
		settingsSection: {
			marginBottom: theme.spacing.lg,
		},
		settingsSectionTitle: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
			textTransform: 'uppercase',
			letterSpacing: 1,
		},
		settingItem: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			borderRadius: theme.spacing.sm,
			marginBottom: theme.spacing.sm,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		settingInfo: {
			flexDirection: 'row',
			alignItems: 'center',
			flex: 1,
			marginRight: theme.spacing.md,
		},
		settingIconContainer: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		settingTextContainer: {
			flex: 1,
		},
		settingLabel: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		settingDescription: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		infoCard: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			borderRadius: theme.spacing.sm,
			padding: theme.spacing.lg,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
			marginBottom: theme.spacing.lg,
			gap: theme.spacing.md,
		},
		infoIcon: {
			marginRight: theme.spacing.md,
		},
		infoContent: {
			flex: 1,
		},
		infoTitle: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
		},
		infoText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			lineHeight: 20,
		},
		searchBar: {
			marginBottom: theme.spacing.md,
		},
		searchResults: {
			marginBottom: theme.spacing.lg,
		},
		sectionTitle: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
			textTransform: 'uppercase',
			letterSpacing: 1,
		},
		resultsList: {
			maxHeight: 200,
		},
		noResults: {
			flex: 0,
			padding: theme.spacing.md,
		},
		userItem: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			borderRadius: theme.spacing.sm,
			marginBottom: theme.spacing.sm,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		memberItem: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.md,
			borderRadius: theme.spacing.sm,
			marginBottom: theme.spacing.sm,
			borderWidth: theme.borders.medium,
			borderColor: theme.colors.border,
		},
		memberItemProcessing: {
			opacity: 0.6,
		},
		userInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		username: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		addButton: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
		},
		addButtonText: {
			fontSize: 24,
			color: theme.colors.surface,
			fontWeight: theme.typography.weights.bold,
			lineHeight: 26,
		},
		editToggleContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			marginRight: theme.spacing.sm,
			minWidth: 100,
		},
		editLabel: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			marginRight: theme.spacing.xs,
		},
		switchPlaceholder: {
			width: 51,
			height: 31,
			justifyContent: 'center',
			alignItems: 'center',
		},
		removeButton: {
			width: 36,
			height: 36,
			borderRadius: 18,
			backgroundColor: theme.colors.error,
			alignItems: 'center',
			justifyContent: 'center',
		},
		removeButtonText: {
			fontSize: 24,
			color: theme.colors.surface,
			fontWeight: theme.typography.weights.bold,
			lineHeight: 26,
		},
		membersSection: {
			flex: 1,
		},
		membersList: {
			flex: 1,
		},
		noMembers: {
			flex: 0,
			padding: theme.spacing.lg,
		},
	});

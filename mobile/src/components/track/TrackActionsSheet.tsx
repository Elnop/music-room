import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Pressable,
	Modal,
	ScrollView,
	ActivityIndicator,
	Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useQueueStore } from '@/store/queueStore';
import { canEditPlaylist } from '@/utils/playlistPermissions';
import { showError, showSuccess } from '@/shared/utils/toast';
import type { AddQueueItemBody } from '@/types/queue.types';
import type { Playlist } from '@/types/playlist.types';
import type { Track } from '@/types/track.types';
import { logger } from '@/shared/utils/logger';

interface TrackActionsSheetProps {
	/** The track to act on (see `toTrackInput`); null hides the sheet. */
	track: AddQueueItemBody | null;
	onClose: () => void;
}

type Step = 'actions' | 'playlists';

/**
 * Quick actions on a track (#316), the same sheet on every track list: play
 * next, add to the queue, add to a playlist I can edit, share the SoundCloud
 * link (the system share sheet, no toast). Queue actions go through
 * `queueStore` (the active queue, mine or the remote owner's), which toasts
 * their outcome. The sheet closes before an
 * action runs, so its toast shows on the screen underneath.
 */
export function TrackActionsSheet({ track, onClose }: TrackActionsSheetProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const userId = useAuthStore(state => state.user?.id);
	const playlists = usePlaylistStore(state => state.playlists);
	const fetchPlaylists = usePlaylistStore(state => state.fetchPlaylists);
	const addTrack = usePlaylistStore(state => state.addTrack);
	const addItem = useQueueStore(state => state.addItem);
	const playNext = useQueueStore(state => state.playNext);

	const visible = track !== null;
	// The last track stays rendered while the sheet slides out.
	const [shown, setShown] = React.useState(track);
	const [step, setStep] = React.useState<Step>('actions');
	const [loadingPlaylists, setLoadingPlaylists] = React.useState(false);
	if (track && track !== shown) {
		setShown(track);
		setStep('actions');
	}

	const editable = React.useMemo(
		() => playlists.filter((playlist: Playlist) => canEditPlaylist(userId, playlist)),
		[playlists, userId]
	);

	const openPlaylists = () => {
		setStep('playlists');
		if (!userId) return;
		setLoadingPlaylists(true);
		fetchPlaylists(userId)
			.catch(error => logger.error('[TrackActionsSheet] Loading playlists failed:', error))
			.finally(() => setLoadingPlaylists(false));
	};

	const run = (action: (body: AddQueueItemBody) => Promise<unknown>) => {
		if (!shown) return;
		const body = shown;
		onClose();
		void action(body);
	};

	const addToPlaylist = (playlist: Playlist) =>
		run(async body => {
			try {
				// The backend generates the id; the cast only satisfies the store signature.
				await addTrack(playlist.id, body as Track);
				showSuccess(`Ajouté à « ${playlist.name} »`);
			} catch (error) {
				logger.error('[TrackActionsSheet] Add to playlist failed:', error);
				showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
			}
		});

	const share = () =>
		run(async body => {
			// No success toast: the system sheet is the feedback, and Android
			// reports a dismissal as sharedAction.
			try {
				await Share.share({ message: body.trackUri, url: body.trackUri, title: body.title });
			} catch (error) {
				logger.error('[TrackActionsSheet] Share failed:', error);
				showError('Impossible de partager ce titre');
			}
		});

	const renderAction = (
		icon: keyof typeof Ionicons.glyphMap,
		label: string,
		onPress: () => void,
		chevron = false
	) => (
		<TouchableOpacity
			style={styles.row}
			onPress={onPress}
			activeOpacity={0.7}
			accessibilityRole="button"
			accessibilityLabel={label}
		>
			<Ionicons name={icon} size={22} color={theme.colors.text} style={styles.rowIcon} />
			<Text style={styles.rowText}>{label}</Text>
			{chevron && <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />}
		</TouchableOpacity>
	);

	const renderPlaylists = () => {
		if (loadingPlaylists && editable.length === 0) {
			return (
				<View style={styles.centered}>
					<ActivityIndicator testID="track-actions-loading" color={theme.colors.primary} />
				</View>
			);
		}
		if (editable.length === 0) {
			return <Text style={styles.emptyText}>Aucune playlist modifiable</Text>;
		}
		return (
			<ScrollView style={styles.list}>
				{editable.map(playlist => (
					<TouchableOpacity
						key={playlist.id}
						style={styles.row}
						onPress={() => addToPlaylist(playlist)}
						activeOpacity={0.7}
						accessibilityRole="button"
						accessibilityLabel={playlist.name}
					>
						<Ionicons
							name="musical-notes-outline"
							size={22}
							color={theme.colors.text}
							style={styles.rowIcon}
						/>
						<View style={styles.rowTextBlock}>
							<Text style={styles.rowText} numberOfLines={1}>
								{playlist.name}
							</Text>
							<Text style={styles.rowSubtext}>
								{playlist.trackCount} {playlist.trackCount === 1 ? 'titre' : 'titres'}
							</Text>
						</View>
					</TouchableOpacity>
				))}
			</ScrollView>
		);
	};

	return (
		<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer" />
			<View style={styles.sheet}>
				<View style={styles.header}>
					{step === 'playlists' && (
						<TouchableOpacity
							onPress={() => setStep('actions')}
							style={styles.backButton}
							accessibilityLabel="Retour"
						>
							<Ionicons name="chevron-back" size={22} color={theme.colors.text} />
						</TouchableOpacity>
					)}
					<View style={styles.headerText}>
						<Text style={styles.title} numberOfLines={1}>
							{step === 'playlists' ? 'Ajouter à une playlist' : shown?.title}
						</Text>
						{step === 'actions' && (
							<Text style={styles.subtitle} numberOfLines={1}>
								{shown?.artist}
							</Text>
						)}
					</View>
				</View>

				{step === 'actions' ? (
					<View>
						{renderAction('play-forward-outline', 'Lire ensuite', () => run(playNext))}
						{renderAction('list-outline', "Ajouter à la file d'attente", () => run(addItem))}
						{renderAction('add-circle-outline', 'Ajouter à une playlist', openPlaylists, true)}
						{renderAction('share-outline', 'Partager', share)}
					</View>
				) : (
					renderPlaylists()
				)}
			</View>
		</Modal>
	);
}

const createStyles = (theme: Theme, bottomInset: number) =>
	StyleSheet.create({
		backdrop: {
			flex: 1,
			backgroundColor: 'rgba(0, 0, 0, 0.5)',
		},
		sheet: {
			backgroundColor: theme.colors.background,
			borderTopLeftRadius: 16,
			borderTopRightRadius: 16,
			paddingBottom: bottomInset + theme.spacing.md,
			maxHeight: '70%',
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.md,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		backButton: {
			marginRight: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
		headerText: {
			flex: 1,
		},
		title: {
			fontSize: 17,
			fontWeight: '700',
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: 14,
		},
		rowIcon: {
			marginRight: theme.spacing.md,
		},
		rowTextBlock: {
			flex: 1,
		},
		rowText: {
			flex: 1,
			fontSize: 16,
			color: theme.colors.text,
		},
		rowSubtext: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		list: {
			maxHeight: 360,
		},
		centered: {
			padding: theme.spacing.xl,
			alignItems: 'center',
		},
		emptyText: {
			padding: theme.spacing.xl,
			textAlign: 'center',
			fontSize: 15,
			color: theme.colors.textSecondary,
		},
	});

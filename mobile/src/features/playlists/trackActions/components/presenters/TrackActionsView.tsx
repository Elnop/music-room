import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { ActionSheet } from '@/features/playlists/actionSheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/actionSheet/components/presenters/ActionSheetRow';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';
import type { TrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';
import { Text } from '@/shared/components/ui/Text';
import { NewPlaylistForm } from '@/features/playlists/trackActions/components/presenters/NewPlaylistForm';

const TITLES = { playlists: 'Ajouter à une playlist', newPlaylist: 'Nouvelle playlist' } as const;

interface TrackActionsViewProps {
	actions: TrackActions;
	anchor: MenuAnchor | null;
	onClose: () => void;
}

/** The sheet of a track's quick actions, or the playlists to add it to. */
export function TrackActionsView({ actions, anchor, onClose }: TrackActionsViewProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { step } = actions;
	const onActions = step === 'actions';

	return (
		<ActionSheet
			visible={actions.visible}
			title={onActions ? actions.shown?.title : TITLES[step]}
			subtitle={onActions ? (actions.shown?.artist ?? '') : undefined}
			onBack={
				step === 'playlists'
					? actions.backToActions
					: step === 'newPlaylist'
						? actions.backToPlaylists
						: undefined
			}
			onClose={onClose}
			maxHeight="70%"
			anchor={anchor}
		>
			{onActions ? (
				<View>
					<ActionSheetRow
						icon="next"
						label="Lire ensuite"
						onPress={actions.playNext}
					/>
					<ActionSheetRow
						icon="queue"
						label="Ajouter à la file d'attente"
						onPress={actions.addToQueue}
					/>
					<ActionSheetRow
						icon="plus"
						label="Ajouter à une playlist"
						onPress={actions.openPlaylists}
						chevron
					/>
					<ActionSheetRow icon="share" label="Partager" onPress={actions.share} />
				</View>
			) : step === 'newPlaylist' ? (
				<NewPlaylistForm draft={actions.newPlaylist} />
			) : (
				<View>
					<ActionSheetRow icon="plus" label="Nouvelle playlist" onPress={actions.openNewPlaylist} />
					{actions.loadingPlaylists ? (
						<View style={styles.centered}>
							<ActivityIndicator testID="track-actions-loading" color={theme.colors.primary} />
						</View>
					) : actions.editable.length === 0 ? (
						<Text style={styles.emptyText}>Aucune playlist modifiable</Text>
					) : (
						<ScrollView style={styles.list}>
							{actions.editable.map(playlist => (
								<ActionSheetRow
									key={playlist.id}
									icon="note"
									label={playlist.name}
									detail={`${playlist.trackCount} ${playlist.trackCount === 1 ? 'titre' : 'titres'}`}
									onPress={() => actions.addToPlaylist(playlist)}
								/>
							))}
						</ScrollView>
					)}
				</View>
			)}
		</ActionSheet>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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

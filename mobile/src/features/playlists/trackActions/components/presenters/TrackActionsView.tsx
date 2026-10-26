import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { ActionSheet } from '@/features/playlists/actionSheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/actionSheet/components/presenters/ActionSheetRow';
import type { MenuAnchor } from '@/shared/utils/menuPlacement';
import type { TrackActions } from '@/features/playlists/trackActions/hooks/useTrackActions';

interface TrackActionsViewProps {
	actions: TrackActions;
	anchor: MenuAnchor | null;
	onClose: () => void;
}

/** The sheet of a track's quick actions, or the playlists to add it to. */
export function TrackActionsView({ actions, anchor, onClose }: TrackActionsViewProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const onPlaylists = actions.step === 'playlists';

	return (
		<ActionSheet
			visible={actions.visible}
			title={onPlaylists ? 'Ajouter à une playlist' : actions.shown?.title}
			subtitle={onPlaylists ? undefined : (actions.shown?.artist ?? '')}
			onBack={onPlaylists ? actions.backToActions : undefined}
			onClose={onClose}
			maxHeight="70%"
			anchor={anchor}
		>
			{!onPlaylists ? (
				<View>
					<ActionSheetRow
						icon="play-forward-outline"
						label="Lire ensuite"
						onPress={actions.playNext}
					/>
					<ActionSheetRow
						icon="list-outline"
						label="Ajouter à la file d'attente"
						onPress={actions.addToQueue}
					/>
					<ActionSheetRow
						icon="add-circle-outline"
						label="Ajouter à une playlist"
						onPress={actions.openPlaylists}
						chevron
					/>
					<ActionSheetRow icon="share-outline" label="Partager" onPress={actions.share} />
				</View>
			) : actions.loadingPlaylists ? (
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
							icon="musical-notes-outline"
							label={playlist.name}
							detail={`${playlist.trackCount} ${playlist.trackCount === 1 ? 'titre' : 'titres'}`}
							onPress={() => actions.addToPlaylist(playlist)}
						/>
					))}
				</ScrollView>
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

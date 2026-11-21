import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { ActionSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/ActionSheet';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/ActionSheetRow';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/hooks/useTrackActions';
import { Text } from '@/shared/theme/components/Text';
import { NewPlaylistForm } from '@/features/playlists/features/editor/features/track-actions/components/presenters/NewPlaylistForm';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

const TITLES = { playlists: 'Ajouter à une playlist', newPlaylist: 'Nouvelle playlist' } as const;

interface TrackActionsViewProps {
	actions: TrackActions;
	anchor: MenuAnchor | null;
	onClose: () => void;
}

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
					<ActionSheetRow icon={ArrowRightSolid} label="Lire ensuite" onPress={actions.playNext} />
					<ActionSheetRow
						icon={PlaylistSolid}
						label="Ajouter à la file d'attente"
						onPress={actions.addToQueue}
					/>
					<ActionSheetRow
						icon={PlusSolid}
						label="Ajouter à une playlist"
						onPress={actions.openPlaylists}
						chevron
					/>
					<ActionSheetRow icon={ShareSolid} label="Partager" onPress={actions.share} />
				</View>
			) : step === 'newPlaylist' ? (
				<NewPlaylistForm draft={actions.newPlaylist} />
			) : (
				<View>
					<ActionSheetRow
						icon={PlusSolid}
						label="Nouvelle playlist"
						onPress={actions.openNewPlaylist}
					/>
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
									icon={MusicSolid}
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

function createStyles(theme: Theme) {
	return StyleSheet.create({
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
}

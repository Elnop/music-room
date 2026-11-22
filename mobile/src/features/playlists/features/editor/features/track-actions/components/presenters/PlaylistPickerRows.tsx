import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetRow';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type PlaylistPickerRowsProps = {
	actions: TrackActions;
};

export function PlaylistPickerRows({ actions }: PlaylistPickerRowsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<ScrollView style={styles.list}>
			{actions.editable.map((playlist) => (
				<ActionSheetRow
					key={playlist.id}
					icon={MusicSolid}
					label={playlist.name}
					detail={`${playlist.trackCount} ${playlist.trackCount === 1 ? 'titre' : 'titres'}`}
					onPress={() => actions.addToPlaylist(playlist)}
				/>
			))}
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		list: {
			maxHeight: theme.controls.playlistPicker,
		},
	});
	return styles;
}

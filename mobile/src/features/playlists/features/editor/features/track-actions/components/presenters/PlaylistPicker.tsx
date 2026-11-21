import React from 'react';
import { View } from 'react-native';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetRow';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import { PlaylistPickerList } from '@/features/playlists/features/editor/features/track-actions/components/presenters/PlaylistPickerList';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type PlaylistPickerProps = {
	actions: TrackActions;
};

export function PlaylistPicker({ actions }: PlaylistPickerProps) {
	return (
		<View>
			<ActionSheetRow
				icon={PlusSolid}
				label="Nouvelle playlist"
				onPress={actions.openNewPlaylist}
			/>
			<PlaylistPickerList actions={actions} />
		</View>
	);
}

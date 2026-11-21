import React from 'react';
import { View } from 'react-native';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetRow';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import ArrowRightSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/arrow-right-solid.svg';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

type TrackActionRowsProps = {
	actions: TrackActions;
};

export function TrackActionRows({ actions }: TrackActionRowsProps) {
	return (
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
	);
}

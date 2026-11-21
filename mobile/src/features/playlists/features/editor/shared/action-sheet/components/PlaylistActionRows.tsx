import React from 'react';
import { View } from 'react-native';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetRow';
import { PlaylistCoverRows } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistCoverRows';
import type { PlaylistActionsMenu } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';
import TrashSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/trash-solid.svg';

type PlaylistActionRowsProps = {
	menu: PlaylistActionsMenu;
	onAction: (action: () => void) => () => void;
};

export function PlaylistActionRows({ menu, onAction }: PlaylistActionRowsProps) {
	return (
		<View>
			<ActionSheetRow icon={PencilSolid} label="Modifier" onPress={onAction(menu.onEdit)} />
			<PlaylistCoverRows menu={menu} onAction={onAction} />
			<ActionSheetRow
				icon={LockSolid}
				label="Visibilité et droits"
				onPress={onAction(menu.onSharing)}
			/>
			<ActionSheetRow
				icon={TrashSolid}
				label="Supprimer"
				onPress={onAction(menu.onDelete)}
				destructive
			/>
		</View>
	);
}

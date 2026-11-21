import React from 'react';
import { ActionSheetRow } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheetRow';
import type { PlaylistActionsMenu } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import CameraSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/camera-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type PlaylistCoverRowsProps = {
	menu: PlaylistActionsMenu;
	onAction: (action: () => void) => () => void;
};

export function PlaylistCoverRows({ menu, onAction }: PlaylistCoverRowsProps) {
	return (
		<>
			<ActionSheetRow
				icon={menu.coverLocked ? LockSolid : CameraSolid}
				label="Changer la cover"
				detail={menu.coverLocked ? 'Réservé au Premium' : undefined}
				onPress={onAction(menu.onChangeCover)}
			/>
			{menu.hasCover && (
				<ActionSheetRow
					icon={TimesSolid}
					label="Retirer la cover"
					onPress={onAction(menu.onRemoveCover)}
				/>
			)}
		</>
	);
}

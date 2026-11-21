import React from 'react';
import { ActionSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheet';
import { PlaylistActionRows } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistActionRows';
import { useDeferredSheetAction } from '@/features/playlists/features/editor/shared/action-sheet/useDeferredSheetAction';
import type { PlaylistActionsMenu } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

type PlaylistActionsSheetProps = {
	visible: boolean;
	anchor: MenuAnchor | null;
	onClose: () => void;
	menu: PlaylistActionsMenu;
};

export function PlaylistActionsSheet({
	visible,
	anchor,
	onClose,
	menu,
}: PlaylistActionsSheetProps) {
	const { run, onDismiss } = useDeferredSheetAction(onClose);

	return (
		<ActionSheet
			visible={visible}
			heading={{ title: menu.playlistName }}
			onClose={onClose}
			onDismiss={onDismiss}
			placement={{ anchor }}
		>
			<PlaylistActionRows menu={menu} onAction={run} />
		</ActionSheet>
	);
}

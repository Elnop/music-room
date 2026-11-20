import React, { type ReactNode } from 'react';
import {
	usePlaylistCardMenu,
	type PlaylistCardMenu,
} from '@/features/playlists/features/editor/features/card-menu/usePlaylistCardMenu';
import { PlaylistActionsSheetContainer } from '@/features/playlists/features/editor/shared/action-sheet/components/PlaylistActionsSheetContainer';
import type { PlanState } from '@/features/subscription/lib/subscription';

interface PlaylistCardMenuContainerProps {
	navigation: Parameters<typeof usePlaylistCardMenu>[0];
	premium: Pick<PlanState, 'isPremium' | 'refetch'>;
	children: (actionsFor: PlaylistCardMenu['actionsFor']) => ReactNode;
}

export function PlaylistCardMenuContainer({
	navigation,
	premium,
	children,
}: PlaylistCardMenuContainerProps) {
	const menu = usePlaylistCardMenu(navigation, premium);
	return (
		<>
			{children(menu.actionsFor)}
			{menu.playlist && (
				<PlaylistActionsSheetContainer
					visible={menu.visible}
					playlistName={menu.playlist.name}
					onClose={menu.close}
					onEdit={menu.edit}
					onSharing={menu.sharing}
					onDelete={menu.remove}
					hasCover={!!menu.playlist.coverUrl}
					coverLocked={menu.coverLocked}
					onChangeCover={menu.changeCover}
					onRemoveCover={menu.removeCover}
				/>
			)}
		</>
	);
}

import React from 'react';
import type { PlaylistCardMenu as Menu } from '@/features/playlists/cardMenu/hooks/usePlaylistCardMenu';
import { PlaylistActionsSheet } from '@/features/playlists/detail/components/orchestrators/PlaylistActionsSheet';

/** Mounted once a card was chosen: on Android no card opens it, so it never renders there. */
export function PlaylistCardMenu({ menu }: { menu: Menu }) {
	if (!menu.playlist) return null;
	return (
		<PlaylistActionsSheet
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
	);
}

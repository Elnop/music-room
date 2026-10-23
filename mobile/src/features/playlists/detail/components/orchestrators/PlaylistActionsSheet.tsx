import React from 'react';
import { useDeferredSheetAction } from '@/features/playlists/detail/hooks/useDeferredSheetAction';
import { PlaylistActionsView } from '@/features/playlists/detail/components/presenters/PlaylistActionsView';

interface PlaylistActionsSheetProps {
	visible: boolean;
	/** Shown as the sheet's title. */
	playlistName: string;
	onClose: () => void;
	onEdit: () => void;
	onSharing: () => void;
	onDelete: () => void;
}

export function PlaylistActionsSheet({
	visible,
	playlistName,
	onClose,
	onEdit,
	onSharing,
	onDelete,
}: PlaylistActionsSheetProps) {
	const { run, onDismiss } = useDeferredSheetAction(onClose);

	return (
		<PlaylistActionsView
			visible={visible}
			playlistName={playlistName}
			onClose={onClose}
			onDismiss={onDismiss}
			onEdit={run(onEdit)}
			onSharing={run(onSharing)}
			onDelete={run(onDelete)}
		/>
	);
}

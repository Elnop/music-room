import React from 'react';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useMenuAnchor';
import { useDeferredSheetAction } from '@/features/playlists/features/editor/shared/action-sheet/hooks/useDeferredSheetAction';
import { PlaylistActionsView } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/PlaylistActionsView';
import type { PlaylistActionsViewProps } from '@/features/playlists/features/editor/shared/action-sheet/components/presenters/PlaylistActionsView';

type PlaylistActionsSheetProps = Omit<PlaylistActionsViewProps, 'onDismiss' | 'anchor'>;

export function PlaylistActionsSheetContainer(props: PlaylistActionsSheetProps) {
	const { run, onDismiss } = useDeferredSheetAction(props.onClose);
	const anchor = useMenuAnchor(props.visible);

	return (
		<PlaylistActionsView
			{...props}
			anchor={anchor}
			onDismiss={onDismiss}
			onEdit={run(props.onEdit)}
			onSharing={run(props.onSharing)}
			onDelete={run(props.onDelete)}
			onChangeCover={run(props.onChangeCover)}
			onRemoveCover={run(props.onRemoveCover)}
		/>
	);
}

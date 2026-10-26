import React from 'react';
import { useMenuAnchor } from '@/shared/hooks/useMenuAnchor';
import { useDeferredSheetAction } from '@/features/playlists/detail/hooks/useDeferredSheetAction';
import {
	PlaylistActionsView,
	type PlaylistActionsViewProps,
} from '@/features/playlists/detail/components/presenters/PlaylistActionsView';

type PlaylistActionsSheetProps = Omit<PlaylistActionsViewProps, 'onDismiss' | 'anchor'>;

/** Each action closes the sheet first (see useDeferredSheetAction). */
export function PlaylistActionsSheet(props: PlaylistActionsSheetProps) {
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

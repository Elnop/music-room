import React from 'react';
import { ActionSheet } from '@/features/playlists/features/editor/shared/action-sheet/components/ActionSheet';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import { trackActionsHeading } from '@/features/playlists/features/editor/features/track-actions/lib/trackActionsHeading';
import { TrackActionsBody } from '@/features/playlists/features/editor/features/track-actions/components/presenters/TrackActionsBody';

type TrackActionsViewProps = {
	actions: TrackActions;
	anchor: MenuAnchor | null;
	onClose: () => void;
};

export function TrackActionsView({ actions, anchor, onClose }: TrackActionsViewProps) {
	return (
		<ActionSheet
			visible={actions.visible}
			heading={trackActionsHeading(actions)}
			onClose={onClose}
			placement={{ anchor, tall: true }}
		>
			<TrackActionsBody actions={actions} />
		</ActionSheet>
	);
}

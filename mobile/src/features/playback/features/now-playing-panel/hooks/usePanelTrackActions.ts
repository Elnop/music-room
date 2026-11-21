import { useState } from 'react';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { menuAnchorActions } from '@/shared/theme/menuAnchorStore';
import type { TrackActionsStart } from '@/shared/playback/types/trackActionsSheetTypes';
import type { MenuAnchor } from '@/shared/theme/types/menuTypes';
import type {
	PanelOpenActions,
	PanelTrackActions,
	PanelTrackSource,
} from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

export function usePanelTrackActions(source: PanelTrackSource | null): PanelTrackActions {
	const [actions, setActions] = useState<PanelOpenActions | null>(null);

	function openActions(anchor: MenuAnchor | undefined, start: TrackActionsStart) {
		menuAnchorActions.record(anchor);
		if (source) setActions({ track: toTrackInput(source), start });
	}

	return {
		actions,
		shareUrl: source ? toTrackInput(source).trackUri : null,
		onAddToPlaylist: anchor => openActions(anchor, 'playlists'),
		onMoreActions: anchor => openActions(anchor, 'actions'),
		onCloseActions: () => setActions(null),
	};
}

import type { ActionSheetHeading } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

const TITLES = { playlists: 'Ajouter à une playlist', newPlaylist: 'Nouvelle playlist' } as const;

export function trackActionsHeading(actions: TrackActions): ActionSheetHeading {
	switch (actions.step) {
		case 'actions':
			return { title: actions.shown?.title, subtitle: actions.shown?.artist ?? '' };
		case 'playlists':
			return { title: TITLES.playlists, onBack: actions.backToActions };
		case 'newPlaylist':
			return { title: TITLES.newPlaylist, onBack: actions.backToPlaylists };
	}
}

import React from 'react';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import { NewPlaylistForm } from '@/features/playlists/features/editor/features/track-actions/components/presenters/NewPlaylistForm';
import { TrackActionRows } from '@/features/playlists/features/editor/features/track-actions/components/presenters/TrackActionRows';
import { PlaylistPicker } from '@/features/playlists/features/editor/features/track-actions/components/presenters/PlaylistPicker';

type TrackActionsBodyProps = {
	actions: TrackActions;
};

export function TrackActionsBody({ actions }: TrackActionsBodyProps) {
	switch (actions.step) {
		case 'actions':
			return <TrackActionRows actions={actions} />;
		case 'newPlaylist':
			return <NewPlaylistForm draft={actions.newPlaylist} />;
		case 'playlists':
			return <PlaylistPicker actions={actions} />;
	}
}

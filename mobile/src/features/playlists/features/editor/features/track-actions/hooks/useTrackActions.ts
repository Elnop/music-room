import { useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import { getPlayback } from '@/shared/playback/lib/playbackBridge';
import { useSession } from '@/shared/backend/lib/authSession';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { usePlaylists } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useAddTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import { canEditPlaylist } from '@/features/playlists/features/editor/shared/permissions/playlistPermissions';
import { useNewPlaylistFromTrack, type NewPlaylistDraft } from './useNewPlaylistFromTrack';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import type { TrackActionsStart } from '@/shared/playback/lib/trackActionsSheet';

type Step = 'actions' | 'playlists' | 'newPlaylist';

export interface TrackActions {
	visible: boolean;
	/** The last track, still rendered while the sheet slides out. */
	shown: AddQueueItemBody | null;
	step: Step;
	editable: Playlist[];
	loadingPlaylists: boolean;
	playNext: () => void;
	addToQueue: () => void;
	openPlaylists: () => void;
	backToActions: () => void;
	openNewPlaylist: () => void;
	backToPlaylists: () => void;
	newPlaylist: NewPlaylistDraft;
	addToPlaylist: (playlist: Playlist) => void;
	share: () => void;
}

/** Each action closes the sheet first so its toast shows on the screen underneath. */
export function useTrackActions(
	track: AddQueueItemBody | null,
	onClose: () => void,
	start: TrackActionsStart = 'actions'
): TrackActions {
	const userId = useSession(session => session.user?.id);
	const [shown, setShown] = useState(track);
	const [step, setStep] = useState<Step>(start);
	if (track && track !== shown) {
		setShown(track);
		setStep(start);
	}
	// Reloaded each time the playlist step opens.
	const list = usePlaylists(step === 'playlists');
	const addTrack = useAddTrack();
	const newPlaylist = useNewPlaylistFromTrack(shown, onClose);

	useEffect(() => {
		if (list.error)
			logger.error('[TrackActionsSheetContainer] Loading playlists failed:', list.error);
	}, [list.error]);

	const editable = useMemo(
		() => (list.data ?? []).filter(playlist => canEditPlaylist(userId, playlist)),
		[list.data, userId]
	);

	const run = (action: (body: AddQueueItemBody) => Promise<unknown>) => {
		if (!shown) return;
		onClose();
		void action(shown);
	};

	return {
		visible: track !== null,
		shown,
		step,
		editable,
		loadingPlaylists: list.isFetching && editable.length === 0,
		playNext: () => run(body => getPlayback().playNext(body)),
		addToQueue: () => run(body => getPlayback().addToQueue(body)),
		openPlaylists: () => setStep('playlists'),
		backToActions: () => setStep('actions'),
		openNewPlaylist: () => {
			newPlaylist.start();
			setStep('newPlaylist');
		},
		backToPlaylists: () => setStep('playlists'),
		newPlaylist,
		addToPlaylist: playlist =>
			run(async body => {
				try {
					await addTrack.mutateAsync({ playlistId: playlist.id, track: body });
					showSuccess(`Ajouté à « ${playlist.name} »`);
				} catch (error) {
					logger.error('[TrackActionsSheetContainer] Add to playlist failed:', error);
					showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
				}
			}),
		// No success toast: the system sheet is the feedback, and Android
		// reports a dismissal as sharedAction.
		share: () =>
			run(async body => {
				try {
					await Share.share({ message: body.trackUri, url: body.trackUri, title: body.title });
				} catch (error) {
					logger.error('[TrackActionsSheetContainer] Share failed:', error);
					showError('Impossible de partager ce titre');
				}
			}),
	};
}

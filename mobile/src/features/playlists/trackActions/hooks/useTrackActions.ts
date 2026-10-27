import { useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';
import { getPlayback } from '@/shared/services/playbackBridge';
import { useSession } from '@/shared/services/authSession';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import { usePlaylists } from '@/features/playlists/hooks/usePlaylistQueries';
import { useAddTrack } from '@/features/playlists/hooks/useTrackEdits';
import { canEditPlaylist } from '@/features/playlists/utils/playlistPermissions';
import {
	useNewPlaylistFromTrack,
	type NewPlaylistDraft,
} from '@/features/playlists/trackActions/hooks/useNewPlaylistFromTrack';
import type { Playlist } from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';
import type { TrackActionsStart } from '@/shared/services/trackActionsBridge';

type Step = 'actions' | 'playlists' | 'newPlaylist';

export interface TrackActions {
	visible: boolean;
	/** The last track, still rendered while the sheet slides out. */
	shown: AddQueueItemBody | null;
	step: Step;
	/** The playlists the user can add the track to. */
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
		if (list.error) logger.error('[TrackActionsSheet] Loading playlists failed:', list.error);
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
					logger.error('[TrackActionsSheet] Add to playlist failed:', error);
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
					logger.error('[TrackActionsSheet] Share failed:', error);
					showError('Impossible de partager ce titre');
				}
			}),
	};
}

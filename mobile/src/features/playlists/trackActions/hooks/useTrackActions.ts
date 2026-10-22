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
import type { Playlist } from '@/features/playlists/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

type Step = 'actions' | 'playlists';

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
	addToPlaylist: (playlist: Playlist) => void;
	share: () => void;
}

/**
 * The quick actions on a track (#316). Each action closes the sheet first, so
 * its toast shows on the screen underneath. Queue actions go through the
 * playback contract, which toasts their outcome.
 */
export function useTrackActions(track: AddQueueItemBody | null, onClose: () => void): TrackActions {
	const userId = useSession(session => session.user?.id);
	const [shown, setShown] = useState(track);
	const [step, setStep] = useState<Step>('actions');
	if (track && track !== shown) {
		setShown(track);
		setStep('actions');
	}
	// Reloaded each time the playlist step opens.
	const list = usePlaylists(step === 'playlists');
	const addTrack = useAddTrack();

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

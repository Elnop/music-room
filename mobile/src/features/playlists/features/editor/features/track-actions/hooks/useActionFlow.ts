import { useState } from 'react';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { TrackActionsStart } from '@/shared/playback/types/trackActionsSheetTypes';
import type {
	ActionFlow,
	TrackActionsStep,
} from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useActionFlow(
	track: AddQueueItemBody | null,
	start: TrackActionsStart,
): ActionFlow {
	const [shown, setShown] = useState(track);
	const [step, setStep] = useState<TrackActionsStep>(start);
	if (track && track !== shown) {
		setShown(track);
		setStep(start);
	}

	return {
		shown,
		step,
		goTo: setStep,
		openPlaylists: () => setStep('playlists'),
		backToActions: () => setStep('actions'),
		backToPlaylists: () => setStep('playlists'),
	};
}

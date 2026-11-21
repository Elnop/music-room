import { useEffect, useRef } from 'react';
import { addListener, disableMediaControls } from 'expo-media-control';
import { safely } from '@/features/playback/features/media-session/lib/mediaControls';
import {
	handleMediaCommand,
	resendPlaybackState,
} from '@/features/playback/features/media-session/lib/mediaCommands';
import type {
	LatestRef,
	SentRef,
} from '@/features/playback/features/media-session/mediaSessionTypes';

const STATE_RESYNC_MS = 1000;

export function useMediaControlListener(latest: LatestRef, sent: SentRef): void {
	const resyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		function scheduleResync() {
			if (resyncRef.current) clearTimeout(resyncRef.current);
			resyncRef.current = setTimeout(() => {
				resyncRef.current = null;
				resendPlaybackState(latest.current.nowPlaying, sent);
			}, STATE_RESYNC_MS);
		}

		const removeListener = addListener(event =>
			handleMediaCommand(event, latest.current, scheduleResync)
		);
		return () => {
			if (resyncRef.current) clearTimeout(resyncRef.current);
			removeListener();
			safely(disableMediaControls());
		};
	}, [latest, sent]);
}

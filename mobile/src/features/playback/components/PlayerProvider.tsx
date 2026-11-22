import React from 'react';
import { PlayerContext } from '@/features/playback/shared/player/configs/playerContextConfig';
import { usePlayerAudio } from '@/features/playback/hooks/usePlayerAudio';
import { useLastTrackPersistence } from '@/features/playback/hooks/useLastTrackPersistence';
import { useQueueAutoAdvance } from '@/features/playback/hooks/useQueueAutoAdvance';
import { useStreamWatchdog } from '@/features/playback/hooks/useStreamWatchdog';
import { useNextTrackPrefetch } from '@/features/playback/hooks/useNextTrackPrefetch';
import { useAudioInterruption } from '@/features/playback/hooks/useAudioInterruption';
import { useBackgroundKeepAlive } from '@/features/playback/hooks/useBackgroundKeepAlive';
import { useAutoplayPrompt } from '@/features/playback/hooks/useAutoplayPrompt';
import { usePlayerVolume } from '@/features/playback/hooks/usePlayerVolume';
import { configureAudioMode } from '@/features/playback/lib/configureAudioMode';
import { registerJsKeepAliveTask } from '@/features/playback/lib/jsKeepAlive';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { MediaSessionBridgeContainer } from '@/features/playback/features/media-session/MediaSessionBridgeContainer';

configureAudioMode();
registerJsKeepAliveTask();

type PlayerProviderProps = {
	children: React.ReactNode;
};

export function PlayerProvider({ children }: PlayerProviderProps) {
	const { player, seekTo } = usePlayerAudio();
	const loading = usePlayerState((state) => state.loading);
	const error = usePlayerState((state) => state.error);

	useLastTrackPersistence();
	useQueueAutoAdvance(player);
	useStreamWatchdog(player);
	useNextTrackPrefetch(player);
	useAudioInterruption(player);
	useBackgroundKeepAlive();
	useAutoplayPrompt(player);
	usePlayerVolume(player);

	const value = React.useMemo(
		() => ({ player, seekTo, loading, error }),
		[player, seekTo, loading, error],
	);

	return (
		<PlayerContext.Provider value={value}>
			<MediaSessionBridgeContainer />
			{children}
		</PlayerContext.Provider>
	);
}

import React from 'react';
import { PlayerContext } from '@/features/playback/shared/player/lib/PlayerContext';
import { usePlayerAudio } from '@/features/playback/shared/player/hooks/usePlayerAudio';
import { useLastTrackPersistence } from '@/features/playback/hooks/useLastTrackPersistence';
import { useQueueAutoAdvance } from '@/features/playback/hooks/useQueueAutoAdvance';
import { useStreamWatchdog } from '@/features/playback/hooks/useStreamWatchdog';
import { useNextTrackPrefetch } from '@/features/playback/hooks/useNextTrackPrefetch';
import { useAudioInterruption } from '@/features/playback/hooks/useAudioInterruption';
import { useBackgroundKeepAlive } from '@/features/playback/hooks/useBackgroundKeepAlive';
import { useAutoplayPrompt } from '@/features/playback/shared/player/hooks/useAutoplayPrompt';
import { usePlayerVolume } from '@/features/playback/hooks/usePlayerVolume';
import { configureAudioMode } from '@/features/playback/lib/audioMode';
import { registerJsKeepAliveTask } from '@/features/playback/lib/jsKeepAlive';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { MediaSessionBridgeContainer } from '@/features/playback/features/media-session/MediaSessionBridgeContainer';

configureAudioMode();
registerJsKeepAliveTask();

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const { player, seekTo } = usePlayerAudio();
	const loading = usePlayerStore(state => state.loading);
	const error = usePlayerStore(state => state.error);

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
		[player, seekTo, loading, error]
	);

	return (
		<PlayerContext.Provider value={value}>
			<MediaSessionBridgeContainer />
			{children}
		</PlayerContext.Provider>
	);
}

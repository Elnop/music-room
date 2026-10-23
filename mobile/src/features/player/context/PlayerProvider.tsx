import React from 'react';
import { PlayerContext } from './PlayerContext';
import { usePlayerAudio } from '@/features/player/hooks/usePlayerAudio';
import { useLastTrackPersistence } from '@/features/player/hooks/useLastTrackPersistence';
import { useQueueAutoAdvance } from '@/features/player/hooks/useQueueAutoAdvance';
import { useStreamWatchdog } from '@/features/player/hooks/useStreamWatchdog';
import { useNextTrackPrefetch } from '@/features/player/hooks/useNextTrackPrefetch';
import { useAudioInterruption } from '@/features/player/hooks/useAudioInterruption';
import { configureAudioMode } from '@/features/player/services/audioMode';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { MediaSessionBridge } from '@/features/player/mediaSession/components/orchestrators/MediaSessionBridge';

configureAudioMode();

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const { player, seekTo } = usePlayerAudio();
	const loading = usePlayerStore(state => state.loading);
	const error = usePlayerStore(state => state.error);

	useLastTrackPersistence();
	useQueueAutoAdvance(player);
	useStreamWatchdog(player);
	useNextTrackPrefetch(player);
	useAudioInterruption(player);

	const value = React.useMemo(
		() => ({ player, seekTo, loading, error }),
		[player, seekTo, loading, error]
	);

	return (
		<PlayerContext.Provider value={value}>
			<MediaSessionBridge />
			{children}
		</PlayerContext.Provider>
	);
}

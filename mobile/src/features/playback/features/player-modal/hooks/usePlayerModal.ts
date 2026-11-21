import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import { largeArtwork } from '@/features/playback/shared/artwork/largeArtwork';
import { useModalOpen } from '@/features/playback/features/player-modal/hooks/useModalOpen';
import { usePlayerColors } from '@/features/playback/features/player-modal/hooks/usePlayerColors';
import { usePlayerSheets } from '@/features/playback/features/player-modal/hooks/usePlayerSheets';
import {
	playerTransport,
	playerTransportActions,
} from '@/features/playback/features/player-modal/lib/playerTransport';

export function usePlayerModal() {
	const { error } = usePlayer();
	const open = useModalOpen();
	const controls = usePlaybackControls();
	const { nowPlaying } = controls;
	const artworkUrl = largeArtwork(nowPlaying.track?.artworkUrl);

	return {
		...open,
		sheets: usePlayerSheets(open.isModalOpen),
		...usePlayerColors(artworkUrl),
		track: nowPlaying.track,
		artworkUrl,
		error,
		isRemote: nowPlaying.isRemote,
		deviceLabel: nowPlaying.deviceLabel,
		transport: playerTransport(controls),
		transportActions: playerTransportActions(controls),
		controls,
	};
}

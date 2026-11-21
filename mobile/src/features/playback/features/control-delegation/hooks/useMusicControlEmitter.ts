import { useEffect } from 'react';
import { useShallow } from 'zustand/shallow';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { useSession } from '@/shared/backend/hooks/useSession';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { emitListeningStatus } from '@/features/playback/features/control-delegation/lib/emitListeningStatus';
import { useControlCommands } from '@/features/playback/features/control-delegation/hooks/useControlCommands';
import { useDeviceInfo } from '@/features/playback/features/control-delegation/hooks/useDeviceInfo';
import type { PlayerState } from '@/features/playback/shared/player/types/playerStateTypes';

function selectReported(state: PlayerState) {
	return {
		currentTrack: state.currentTrack,
		isPlaying: state.isPlaying,
		seekCount: state.seekCount,
	};
}

export function useMusicControlEmitter() {
	const deviceInfo = useDeviceInfo();
	const socket = useSocketState(state => state.socket);
	const isConnected = useSocketState(state => state.isConnected);
	const user = useSession(state => state.user);
	const playback = usePlayerState(useShallow(selectReported));

	useEffect(() => {
		if (!socket || !isConnected || !user || !deviceInfo) return;
		const timer = setTimeout(
			() => emitListeningStatus(socket, playback.currentTrack, playback.isPlaying),
			200
		);
		return () => clearTimeout(timer);
	}, [
		socket,
		isConnected,
		user,
		deviceInfo,
		playback.currentTrack,
		playback.isPlaying,
		playback.seekCount,
	]);

	useControlCommands();
}

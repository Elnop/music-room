import { useEffect, useState } from 'react';
import type {
	ConnectTarget,
	ListeningStatus,
} from '@/features/playback/shared/player/types/queueTypes';

const REMOTE_TICK_MS = 1000;

export function useRemoteClock(target: ConnectTarget, status: ListeningStatus | null): number {
	const remotePlaying = target.kind === 'remote' && (status?.isPlaying ?? false);
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!remotePlaying) return;
		const timer = setInterval(() => setNow(Date.now()), REMOTE_TICK_MS);
		return () => clearInterval(timer);
	}, [remotePlaying]);
	return now;
}

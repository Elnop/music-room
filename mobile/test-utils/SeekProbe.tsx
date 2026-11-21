import { useEffect } from 'react';
import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';

type SeekProbeProps = {
	onSeekTo: (seekTo: (seconds: number) => void) => void;
};

export function SeekProbe({ onSeekTo }: SeekProbeProps) {
	const { seekTo } = usePlayer();
	useEffect(() => onSeekTo(seekTo), [onSeekTo, seekTo]);
	return null;
}

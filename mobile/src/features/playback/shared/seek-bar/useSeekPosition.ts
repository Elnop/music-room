import { useEffect, useState } from 'react';
import type { SeekPosition } from '@/features/playback/shared/seek-bar/seekBarTypes';

const CAUGHT_UP_S = 1;
const HOLD_MS = 3000;

export function useSeekPosition(
	currentTime: number,
	onSeek: (value: number) => void
): SeekPosition {
	const [dragValue, setDragValue] = useState<number | null>(null);
	const [target, setTarget] = useState<number | null>(null);

	if (target !== null && Math.abs(currentTime - target) < CAUGHT_UP_S) setTarget(null);

	useEffect(() => {
		if (target === null) return;
		const timer = setTimeout(() => setTarget(null), HOLD_MS);
		return () => clearTimeout(timer);
	}, [target]);

	return {
		position: dragValue ?? target ?? currentTime,
		onSlidingStart: setDragValue,
		onValueChange: value => setDragValue(current => (current === null ? current : value)),
		onSlidingComplete: value => {
			setDragValue(null);
			setTarget(value);
			onSeek(value);
		},
	};
}

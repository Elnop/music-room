import { useEffect, useState } from 'react';

/** The player has caught up with a seek once its position is this close to the target. */
const CAUGHT_UP_S = 1;
/** A seek the player never reports (failed, or a new track) stops holding the thumb after this. */
const HOLD_MS = 3000;

export interface SeekPosition {
	/** What the slider and the elapsed time show. */
	position: number;
	onSlidingStart: (value: number) => void;
	onValueChange: (value: number) => void;
	onSlidingComplete: (value: number) => void;
}

/** Keeps the thumb under the finger while dragging, then on the target until the player reaches it. */
export function useSeekPosition(
	currentTime: number,
	onSeek: (value: number) => void
): SeekPosition {
	const [dragValue, setDragValue] = useState<number | null>(null);
	const [target, setTarget] = useState<number | null>(null);

	useEffect(() => {
		if (target !== null && Math.abs(currentTime - target) < CAUGHT_UP_S) setTarget(null);
	}, [currentTime, target]);

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

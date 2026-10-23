import { useEffect, useState } from 'react';

interface Countdown {
	/** Seconds left; 0 when the countdown is not running. */
	seconds: number;
	start: (seconds: number) => void;
}

export function useCountdown(): Countdown {
	const [seconds, setSeconds] = useState(0);

	useEffect(() => {
		if (seconds <= 0) return;
		const timer = setTimeout(() => setSeconds(value => value - 1), 1000);
		return () => clearTimeout(timer);
	}, [seconds]);

	return { seconds, start: setSeconds };
}

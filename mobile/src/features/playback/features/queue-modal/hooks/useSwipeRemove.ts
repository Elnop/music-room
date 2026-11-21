import { useRef } from 'react';
import type { Swipeable } from 'react-native-gesture-handler';

export function useSwipeRemove(remove: () => Promise<boolean>) {
	const swipeableRef = useRef<Swipeable>(null);

	async function handleRemove() {
		const removed = await remove();
		if (!removed) swipeableRef.current?.close();
	}

	return { swipeableRef, handleRemove };
}

import { useState } from 'react';
import {
	locateCurrentPlace,
	resolveAddress,
} from '@/features/events/features/event-form/lib/eventPlace';
import type {
	EventPlace,
	Located,
} from '@/features/events/features/event-form/types/eventFormTypes';

export function useEventPlace(
	edited: Located | undefined,
	setAddress: (address: string) => void
): EventPlace {
	const [located, setLocated] = useState<Located | null>(() =>
		edited
			? { latitude: edited.latitude, longitude: edited.longitude, address: edited.address }
			: null
	);
	const [isLocating, setIsLocating] = useState(false);

	async function locateHere() {
		setIsLocating(true);
		const place = await locateCurrentPlace();
		if (place) {
			setLocated(place);
			setAddress(place.address);
		}
		setIsLocating(false);
	}

	return {
		isLocating,
		locateHere: () => void locateHere(),
		resolve: address => resolveAddress(located, address),
	};
}

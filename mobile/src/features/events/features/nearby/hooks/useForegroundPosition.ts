import { useCallback, useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useScreenActive } from '@/features/events/features/nearby/hooks/useScreenActive';
import { watchForegroundPosition } from '@/features/events/features/nearby/lib/watchForegroundPosition';
import { requestLocationPermission } from '@/features/events/shared/location/lib/eventLocation';
import type {
	ForegroundPosition,
	PositionState,
} from '@/features/events/features/nearby/nearbyTypes';

function usePermissionRequest() {
	const [pending, setPending] = useState<Promise<boolean> | null>(null);
	const requestPermission = useCallback(() => setPending(requestLocationPermission()), []);
	return { pending, requestPermission };
}

export function useForegroundPosition(): ForegroundPosition {
	const active = useScreenActive();
	const [state, setState] = useState<PositionState>({ status: 'checking' });
	const permission = usePermissionRequest();

	useEffect(() => {
		if (!active) return undefined;
		return watchForegroundPosition(setState, permission.pending);
	}, [active, permission.pending]);

	return {
		state,
		requestPermission: permission.requestPermission,
		openSettings: () => void Linking.openSettings(),
	};
}

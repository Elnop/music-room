import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { logger } from '@/shared/utils/logger';
import { useAppActive } from '@/features/events/hooks/useAppActive';
import { requestLocationPermission, type Coordinates } from '@/features/events/utils/eventLocation';

export type PositionState =
	| { status: 'checking' }
	/** Not asked yet, or refused once: the section offers to ask. */
	| { status: 'needs-permission' }
	/** Refused for good: only the system settings can grant it. */
	| { status: 'denied' }
	| { status: 'disabled' }
	| { status: 'waiting' }
	/** The browser gave no position in time; asking again restarts the search. */
	| { status: 'timed-out' }
	| { status: 'located'; position: Coordinates };

interface ForegroundPosition {
	state: PositionState;
	requestPermission: () => void;
	openSettings: () => void;
}

const WATCH_OPTIONS: Location.LocationOptions = {
	accuracy: Location.Accuracy.Balanced,
	distanceInterval: 20,
	timeInterval: 10_000,
};

/** A browser may never answer (no location source), and expo-location registers no error callback. */
const WEB_POSITION_TIMEOUT_MS = 15_000;

/** A browser does not prompt again once refused, though expo-location reports `canAskAgain`. */
function isRefusedForGood(permission: Location.LocationPermissionResponse): boolean {
	if (Platform.OS === 'web') return permission.status === Location.PermissionStatus.DENIED;
	return !permission.canAskAgain;
}

/** Follows the position while the screen is shown and the app in the foreground, never in the background. */
export function useForegroundPosition(): ForegroundPosition {
	const isFocused = useIsFocused();
	const appActive = useAppActive();
	const [state, setState] = useState<PositionState>({ status: 'checking' });
	const [attempt, setAttempt] = useState(0);

	useEffect(() => {
		if (!isFocused || !appActive) return undefined;
		let cancelled = false;
		let subscription: Location.LocationSubscription | undefined;
		let timeout: ReturnType<typeof setTimeout> | undefined;

		const watch = async () => {
			const permission = await Location.getForegroundPermissionsAsync();
			if (permission.status !== 'granted') {
				setState({ status: isRefusedForGood(permission) ? 'denied' : 'needs-permission' });
				return;
			}
			if (!(await Location.hasServicesEnabledAsync())) {
				setState({ status: 'disabled' });
				return;
			}
			setState(current => (current.status === 'located' ? current : { status: 'waiting' }));
			if (Platform.OS === 'web') {
				timeout = setTimeout(() => {
					setState(current => (current.status === 'located' ? current : { status: 'timed-out' }));
				}, WEB_POSITION_TIMEOUT_MS);
			}
			subscription = await Location.watchPositionAsync(WATCH_OPTIONS, ({ coords }) => {
				if (!cancelled) {
					setState({
						status: 'located',
						position: { latitude: coords.latitude, longitude: coords.longitude },
					});
				}
			});
			if (cancelled) subscription.remove();
		};

		watch().catch(error => {
			logger.warn('[NearbyEvents] Position unavailable:', error);
			if (!cancelled) setState({ status: 'disabled' });
		});
		return () => {
			cancelled = true;
			if (timeout) clearTimeout(timeout);
			subscription?.remove();
		};
	}, [isFocused, appActive, attempt]);

	const requestPermission = useCallback(() => {
		void requestLocationPermission().then(() => setAttempt(count => count + 1));
	}, []);

	return {
		state,
		requestPermission,
		openSettings: () => void Linking.openSettings(),
	};
}

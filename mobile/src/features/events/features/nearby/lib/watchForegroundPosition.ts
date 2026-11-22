import type { Dispatch, SetStateAction } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { logger } from '@/shared/logging/logger';
import type { PositionState } from '@/features/events/features/nearby/nearbyTypes';

type SetPosition = Dispatch<SetStateAction<PositionState>>;

type WatchSession = {
	cancelled: boolean;
	subscription?: Location.LocationSubscription;
	timeout?: ReturnType<typeof setTimeout>;
};

const WATCH_OPTIONS: Location.LocationOptions = {
	accuracy: Location.Accuracy.Balanced,
	distanceInterval: 20,
	timeInterval: 10_000,
};

const WEB_POSITION_TIMEOUT_MS = 15_000;

async function readyToWatch(setState: SetPosition): Promise<boolean> {
	const permission = await Location.getForegroundPermissionsAsync();
	if (permission.status !== 'granted') {
		const refusedForGood =
			Platform.OS === 'web'
				? permission.status === Location.PermissionStatus.DENIED
				: !permission.canAskAgain;
		setState({ status: refusedForGood ? 'denied' : 'needs-permission' });
		return false;
	}
	if (!(await Location.hasServicesEnabledAsync())) {
		setState({ status: 'disabled' });
		return false;
	}
	return true;
}

function startWebTimeout(session: WatchSession, setState: SetPosition): void {
	if (Platform.OS !== 'web') return;
	session.timeout = setTimeout(() => {
		setState((current) => (current.status === 'located' ? current : { status: 'timed-out' }));
	}, WEB_POSITION_TIMEOUT_MS);
}

async function watch(
	session: WatchSession,
	setState: SetPosition,
	pendingRequest: Promise<boolean> | null,
): Promise<void> {
	if (pendingRequest) await pendingRequest;
	if (!(await readyToWatch(setState))) return;
	setState((current) => (current.status === 'located' ? current : { status: 'waiting' }));
	startWebTimeout(session, setState);
	session.subscription = await Location.watchPositionAsync(WATCH_OPTIONS, ({ coords }) => {
		if (!session.cancelled) {
			setState({
				status: 'located',
				position: { latitude: coords.latitude, longitude: coords.longitude },
			});
		}
	});
	if (session.cancelled) session.subscription.remove();
}

export function watchForegroundPosition(
	setState: SetPosition,
	pendingRequest: Promise<boolean> | null,
): () => void {
	const session: WatchSession = { cancelled: false };
	watch(session, setState, pendingRequest).catch((error) => {
		logger.warn('[NearbyEvents] Position unavailable:', error);
		if (!session.cancelled) setState({ status: 'disabled' });
	});
	return () => {
		session.cancelled = true;
		if (session.timeout) clearTimeout(session.timeout);
		session.subscription?.remove();
	};
}

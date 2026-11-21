import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EventStackParamList, MusicEvent } from '@/features/events/eventTypes';

export type AdvertiseFailure = 'unsupported' | 'bluetooth-off' | 'permission-denied' | 'failed';

export type BeaconBroadcast = {
	available: boolean;
	active: boolean;
	starting: boolean;
	toggle: (on: boolean) => void;
};

export type EventDetailNavigation = NativeStackNavigationProp<EventStackParamList, 'EventDetail'>;

export type EventDetailScreen = {
	event: MusicEvent | undefined;
	isLoading: boolean;
	failed: boolean;
	isOrganizer: boolean;
	isDeleting: boolean;
	openPlaylist: () => void;
	edit: () => void;
	remove: () => void;
};

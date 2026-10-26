import { Platform } from 'react-native';

/** A browser has no Bluetooth advertising. */
export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

/** The web app calls the backend it was built for: no address to pick. */
export const BACKEND_URL_EDITABLE = Platform.OS !== 'web';

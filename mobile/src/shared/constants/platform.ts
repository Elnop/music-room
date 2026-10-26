import { Platform } from 'react-native';

/** A browser has no Bluetooth advertising. */
export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

/** The web app calls the backend it was built for: no address to pick. */
export const BACKEND_URL_EDITABLE = Platform.OS !== 'web';

/** What the user calls the device the app runs on. */
export const THIS_DEVICE_LABEL = Platform.OS === 'web' ? 'Ce navigateur' : 'Ce téléphone';

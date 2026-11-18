import { Platform } from 'react-native';

/** A browser has no Bluetooth advertising. */
export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

export const THIS_DEVICE_LABEL = Platform.OS === 'web' ? 'Ce navigateur' : 'Ce téléphone';

/** Native users have the app already: the landing is for browser visitors. */
export const LANDING_SHOWN = Platform.OS === 'web';

import { Platform } from 'react-native';

/** A browser has no Bluetooth advertising. */
export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

/** What the user calls the device the app runs on. */
export const THIS_DEVICE_LABEL = Platform.OS === 'web' ? 'Ce navigateur' : 'Ce téléphone';

/** The Android app is already installed: the presentation and the download are for browser visitors. */
export const LANDING_SHOWN = Platform.OS === 'web';

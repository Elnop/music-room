import { Platform } from 'react-native';

/** Google and Facebook sign-in run through native SDKs, which the browser does not have. */
export const SOCIAL_SIGN_IN_AVAILABLE = Platform.OS !== 'web';

/** A browser has no Bluetooth advertising. */
export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

/** The web app calls the backend it was built for: no address to pick. */
export const BACKEND_URL_EDITABLE = Platform.OS !== 'web';

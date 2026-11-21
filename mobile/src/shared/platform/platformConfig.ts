import { Platform } from 'react-native';

export const BEACON_BROADCAST_AVAILABLE = Platform.OS !== 'web';

export const THIS_DEVICE_LABEL = Platform.OS === 'web' ? 'Ce navigateur' : 'Ce téléphone';

export const LANDING_SHOWN = Platform.OS === 'web';

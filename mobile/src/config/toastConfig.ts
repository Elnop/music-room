import { BaseToastProps } from 'react-native-toast-message';

/**
 * Custom Toast configuration for Zumik
 * Matches the app's dark theme with Spotify-inspired colors
 */

export const toastConfig = {
  success: (props: BaseToastProps) => ({
    style: {
      backgroundColor: '#1DB954', // Zumik green
      borderLeftColor: '#1DB954',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    text1Style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ...props,
  }),
  error: (props: BaseToastProps) => ({
    style: {
      backgroundColor: '#FF6B6B', // Error red
      borderLeftColor: '#FF6B6B',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    text1Style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ...props,
  }),
  info: (props: BaseToastProps) => ({
    style: {
      backgroundColor: '#4A9EFF', // Info blue
      borderLeftColor: '#4A9EFF',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    text1Style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ...props,
  }),
  warning: (props: BaseToastProps) => ({
    style: {
      backgroundColor: '#FFA500', // Warning orange
      borderLeftColor: '#FFA500',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    text1Style: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    ...props,
  }),
};

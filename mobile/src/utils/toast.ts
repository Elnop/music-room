import Toast from 'react-native-toast-message';

/**
 * Toast utility wrapper for Zumik
 * Provides consistent toast notifications across the app
 * Position: top (as requested)
 * Auto-dismiss: 3-4 seconds depending on type
 */

export const showSuccess = (message: string, duration = 3000) => {
  Toast.show({
    type: 'success',
    text1: message,
    position: 'top',
    visibilityTime: duration,
  });
};

export const showError = (message: string, duration = 4000) => {
  Toast.show({
    type: 'error',
    text1: message,
    position: 'top',
    visibilityTime: duration,
  });
};

export const showInfo = (message: string, duration = 3000) => {
  Toast.show({
    type: 'info',
    text1: message,
    position: 'top',
    visibilityTime: duration,
  });
};

export const showWarning = (message: string, duration = 4000) => {
  Toast.show({
    type: 'warning',
    text1: message,
    position: 'top',
    visibilityTime: duration,
  });
};

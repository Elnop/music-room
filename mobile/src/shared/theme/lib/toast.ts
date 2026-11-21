import Toast from 'react-native-toast-message';

export function showSuccess(message: string, duration = 3000) {
	Toast.show({
		type: 'success',
		text1: message,
		position: 'top',
		visibilityTime: duration,
	});
}

export function showError(message: string, duration = 4000) {
	Toast.show({
		type: 'error',
		text1: message,
		position: 'top',
		visibilityTime: duration,
	});
}

export function showInfo(message: string, duration = 3000) {
	Toast.show({
		type: 'info',
		text1: message,
		position: 'top',
		visibilityTime: duration,
	});
}

export function showWarning(message: string, duration = 4000) {
	Toast.show({
		type: 'warning',
		text1: message,
		position: 'top',
		visibilityTime: duration,
	});
}

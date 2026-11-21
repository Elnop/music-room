import type { ToastConfigParams } from 'react-native-toast-message';

export function toastAccessibilityLabel(params: ToastConfigParams<unknown>): string {
	return [params.text1, params.text2].filter(Boolean).join('. ');
}

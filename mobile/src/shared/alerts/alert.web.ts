import type { AlertButton } from 'react-native';
import { useAlertStore } from './alertStore';

export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	useAlertStore.getState().push({ title, message, buttons });
}

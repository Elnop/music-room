import type { AlertButton } from 'react-native';
import { alertStore } from '@/shared/alerts/alertStore';

export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	alertStore.getState().push({ title, message, buttons });
}

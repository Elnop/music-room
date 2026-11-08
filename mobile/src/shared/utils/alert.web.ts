import type { AlertButton } from 'react-native';
import { useAlertStore } from '@/shared/stores/alertStore';

export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	useAlertStore.getState().push({ title, message, buttons });
}

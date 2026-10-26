import type { AlertButton } from 'react-native';
import { useAlertStore } from '@/shared/stores/alertStore';

// Browser variant: react-native-web's Alert.alert does nothing, so AlertHost shows the alert as a dialog.
export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	useAlertStore.getState().push({ title, message, buttons });
}

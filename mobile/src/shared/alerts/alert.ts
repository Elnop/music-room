import { Alert } from 'react-native';
import type { AlertButton } from 'react-native';

export function showAlert(title: string, message: string, buttons: AlertButton[]): void {
	Alert.alert(title, message, buttons);
}

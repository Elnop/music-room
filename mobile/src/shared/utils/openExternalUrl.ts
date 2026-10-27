import { Linking } from 'react-native';
import { showError } from '@/shared/utils/toast';

export function openExternalUrl(url: string): void {
	Linking.openURL(url).catch(() => showError("Impossible d'ouvrir le lien"));
}

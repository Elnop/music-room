import { Linking } from 'react-native';

const OPEN_LINK_FAILED = "Impossible d'ouvrir le lien";

export function openExternalUrl(url: string, onFailure: (message: string) => void): void {
	Linking.openURL(url).catch(() => onFailure(OPEN_LINK_FAILED));
}

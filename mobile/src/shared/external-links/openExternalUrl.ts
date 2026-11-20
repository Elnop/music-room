import { Linking } from 'react-native';

export const OPEN_LINK_FAILED = "Impossible d'ouvrir le lien";

export function openExternalUrl(url: string, onFailure: () => void): void {
	Linking.openURL(url).catch(onFailure);
}

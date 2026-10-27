import type { Ionicons } from '@expo/vector-icons';

export interface LandingFeature {
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
}

export const LANDING_INTRO =
	'Zumik est une application musicale collaborative pour Android, iOS et le web. Construisez des playlists ensemble en temps réel et partagez avec vos amis le contrôle de la musique qui joue sur vos appareils.';

export const LANDING_FEATURES: LandingFeature[] = [
	{
		title: 'Playlist Editor',
		description:
			'Modifiez une playlist à plusieurs : chaque changement apparaît en direct pour tout le monde.',
		icon: 'musical-notes-outline',
	},
	{
		title: 'Music Control Delegation',
		description: 'Laissez un ami contrôler la musique qui joue sur votre appareil.',
		icon: 'phone-portrait-outline',
	},
	{
		title: 'Amis et profils',
		description: 'Suivez vos amis et choisissez ce que chacun peut voir de votre profil.',
		icon: 'people-outline',
	},
	{
		title: 'Connexion',
		description: 'Avec une adresse email, un compte Google ou un compte Facebook.',
		icon: 'log-in-outline',
	},
];

import type { PixelSpriteName } from '@/shared/constants/pixelSprites';

export interface LandingFeature {
	title: string;
	description: string;
	icon: PixelSpriteName;
}

export const LANDING_INTRO =
	'Zumik est une application musicale collaborative pour Android, iOS et le web. Construisez des playlists ensemble en temps réel et partagez avec vos amis le contrôle de la musique qui joue sur vos appareils.';

export const LANDING_FEATURES: LandingFeature[] = [
	{
		title: 'Playlist Editor',
		description:
			'Modifiez une playlist à plusieurs : chaque changement apparaît en direct pour tout le monde.',
		icon: 'note',
	},
	{
		title: 'Music Control Delegation',
		description: 'Laissez un ami contrôler la musique qui joue sur votre appareil.',
		icon: 'phone',
	},
	{
		title: 'Amis et profils',
		description: 'Suivez vos amis et choisissez ce que chacun peut voir de votre profil.',
		icon: 'crew',
	},
	{
		title: 'Connexion',
		description: 'Avec une adresse email, un compte Google ou un compte Facebook.',
		icon: 'login',
	},
];

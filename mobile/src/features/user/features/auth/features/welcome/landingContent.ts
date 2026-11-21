import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import LoginSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/login-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

export type LandingFeature = {
	title: string;
	description: string;
	icon: PixelIconSource;
};

export const LANDING_INTRO =
	'Zumik est une application musicale collaborative pour Android, iOS et le web. Construisez des playlists ensemble en temps réel et partagez avec vos amis le contrôle de la musique qui joue sur vos appareils.';

export const LANDING_FEATURES: LandingFeature[] = [
	{
		title: 'Playlist Editor',
		description:
			'Modifiez une playlist à plusieurs : chaque changement apparaît en direct pour tout le monde.',
		icon: MusicSolid,
	},
	{
		title: 'Music Control Delegation',
		description: 'Laissez un ami contrôler la musique qui joue sur votre appareil.',
		icon: PhoneRingingLowSolid,
	},
	{
		title: 'Amis et profils',
		description: 'Suivez vos amis et choisissez ce que chacun peut voir de votre profil.',
		icon: UsersSolid,
	},
	{
		title: 'Connexion',
		description: 'Avec une adresse email, un compte Google ou un compte Facebook.',
		icon: LoginSolid,
	},
];

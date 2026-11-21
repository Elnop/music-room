import type { ProfileMenuEntry } from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import LinkSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/link-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

export const PROFILE_MENU_ENTRIES: ProfileMenuEntry[] = [
	{
		title: 'Confidentialité',
		subtitle: 'Gérez qui peut voir vos informations',
		icon: LockSolid,
		action: 'onPrivacySettings',
	},
	{
		title: 'Comptes liés',
		subtitle: 'Ajoutez ou retirez la connexion Google et Facebook',
		icon: LinkSolid,
		action: 'onLinkedAccounts',
	},
	{
		title: 'Mes appareils',
		subtitle: 'Choisissez quels amis contrôlent chaque appareil',
		icon: PhoneRingingLowSolid,
		action: 'onMyDevices',
	},
];

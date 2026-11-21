import type { GoogleButtonSlot } from '@/features/user/features/auth/authTypes';

export type SocialSignIn = {
	onGoogle: () => void;
	onFacebook: () => void;
	googleButton?: GoogleButtonSlot;
	isPending: boolean;
};

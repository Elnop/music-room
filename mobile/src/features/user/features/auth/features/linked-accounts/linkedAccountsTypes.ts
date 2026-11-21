import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type {
	GoogleButtonSlot,
	LinkedProvider,
	OAuthProvider,
} from '@/features/user/features/auth/authTypes';

export type SignInMethod = {
	type: LinkedProvider['type'];
	label: string;
	icon: PixelIconSource;
};

export type LinkActions = {
	pending: OAuthProvider | null;
	onLink: (provider: OAuthProvider) => void;
	onUnlink: (provider: OAuthProvider) => void;
	googleButton?: GoogleButtonSlot;
};

export type LinkedAccountsScreen = {
	bottomPadding: number;
	isLoading: boolean;
	linkedProviders?: LinkedProvider[];
	actions: LinkActions;
};

export type SetPendingProvider = (provider: OAuthProvider | null) => void;

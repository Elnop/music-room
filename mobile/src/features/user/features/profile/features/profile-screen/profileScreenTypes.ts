import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import type { UserStats } from '@/features/user/features/profile/profileTypes';
import type { MusicGenre } from '@/shared/users/userTypes';

export type ProfileActions = {
	isLoggingOut: boolean;
	onEditProfile: () => void;
	onSettings: () => void;
	onMusicPreferences: () => void;
	onPrivacySettings: () => void;
	onLinkedAccounts: () => void;
	onMyDevices: () => void;
	onConfirmLogout: () => void;
};

export type ProfileContent = {
	stats?: UserStats | null;
	genres: MusicGenre[];
	buildLabel: string;
};

export type ProfileRefresh = {
	isRefreshing: boolean;
	onRefresh: () => void;
};

export type ProfileMenuEntry = {
	title: string;
	subtitle: string;
	icon: PixelIconSource;
	action: 'onPrivacySettings' | 'onLinkedAccounts' | 'onMyDevices';
};

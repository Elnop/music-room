import { useSession } from '@/shared/backend/hooks/useSession';
import { getBuildLabel } from '@/shared/backend/deviceService';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useConfirmLogout } from '@/features/user/features/profile/features/profile-screen/hooks/useConfirmLogout';
import { useProfileData } from '@/features/user/features/profile/features/profile-screen/hooks/useProfileData';
import { useProfileNavigation } from '@/features/user/features/profile/features/profile-screen/hooks/useProfileNavigation';

export function useProfileScreen() {
	const bottomPadding = useBottomPadding();
	const user = useSession(s => s.user);
	const profileNavigation = useProfileNavigation();
	const data = useProfileData();
	const logoutState = useConfirmLogout();

	return {
		bottomPadding,
		user,
		navigation: profileNavigation.navigation,
		content: { stats: data.stats, genres: data.genres, buildLabel: getBuildLabel() },
		refresh: data.refresh,
		actions: {
			...profileNavigation.actions,
			isLoggingOut: logoutState.isLoggingOut,
			onConfirmLogout: logoutState.confirmLogout,
		},
	};
}

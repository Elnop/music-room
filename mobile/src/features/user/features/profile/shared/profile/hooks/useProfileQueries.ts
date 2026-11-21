import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useSession } from '@/shared/backend/hooks/useSession';
import { privacyApi } from '@/features/user/features/profile/shared/profile/lib/privacyApi';
import { profileApi } from '@/features/user/features/profile/shared/profile/lib/profileApi';

export function useProfilePrivacy() {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.privacy(),
		queryFn: () => privacyApi.getPrivacySettings(),
		enabled: authenticated,
		staleTime: STALE.none,
		refetchOnMount: 'always',
		retry: false,
	});
}

export function useUserMusicPreferences(options?: { refetchOnMount?: boolean | 'always' }) {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.profile.musicPreferences(),
		queryFn: () => privacyApi.getMusicPreferences(),
		enabled: authenticated,
		staleTime: STALE.short,
		refetchOnMount: options?.refetchOnMount ?? true,
		retry: false,
	});
}

export function useUserStats() {
	const authenticated = useSession(s => s.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.friends.stats(),
		queryFn: () => profileApi.getMyStats(),
		enabled: authenticated,
		staleTime: STALE.short,
		retry: false,
	});
}

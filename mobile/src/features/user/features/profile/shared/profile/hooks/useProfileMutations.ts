import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/keys';
import { setUser } from '@/shared/backend/lib/authSession';
import { privacyApi } from '@/features/user/features/profile/shared/profile/lib/privacyApi';
import { profileApi } from '@/features/user/features/profile/shared/profile/lib/profileApi';
import type {
	UpdateMusicPreferencesData,
	UpdatePrivacyData,
	UpdateProfileData,
} from '@/shared/users/user.types';

export function useUpdateProfileMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
		onSuccess: async updatedUser => {
			await setUser(updatedUser);
			queryClient.setQueryData(queryKeys.profile.me(), updatedUser);
		},
	});
}

export function useUpdatePrivacyMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdatePrivacyData) => privacyApi.updatePrivacySettings(data),
		onSuccess: data => {
			queryClient.setQueryData(queryKeys.profile.privacy(), data);
		},
	});
}

export function useUpdateMusicPreferencesMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateMusicPreferencesData) => privacyApi.updateMusicPreferences(data),
		onSuccess: data => {
			queryClient.setQueryData(queryKeys.profile.musicPreferences(), data);
		},
	});
}

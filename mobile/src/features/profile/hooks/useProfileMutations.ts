import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { setUser } from '@/shared/services/authSession';
import { privacyApi } from '@/features/profile/services/privacyApi';
import { profileApi } from '@/features/profile/services/profileApi';
import type {
	UpdateMusicPreferencesData,
	UpdatePrivacyData,
	UpdateProfileData,
} from '@/types/user.types';

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

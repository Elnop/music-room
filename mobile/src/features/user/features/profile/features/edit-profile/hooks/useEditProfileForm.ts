import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useProfileSubmit } from '@/features/user/features/profile/features/edit-profile/hooks/useProfileSubmit';
import { updateProfileSchema } from '@/features/user/features/profile/features/edit-profile/profileSchemas';
import type {
	EditProfileFormState,
	UpdateProfileInput,
} from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import type { UserProfile } from '@/shared/users/userTypes';

export function useEditProfileForm(user: UserProfile | null): EditProfileFormState {
	const submission = useProfileSubmit(user);
	const form = useForm<UpdateProfileInput>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			displayName: user?.displayName || user?.username || '',
			bio: user?.bio || '',
		},
	});

	return {
		control: form.control,
		errors: form.formState.errors,
		error: submission.error,
		isLoading: submission.isLoading,
		isDirty: form.formState.isDirty,
		onSubmit: form.handleSubmit(submission.submit),
		onCancel: submission.cancel,
	};
}

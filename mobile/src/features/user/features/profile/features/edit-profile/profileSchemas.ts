import { z } from 'zod';
import { PROFILE_LIMITS } from '@/features/user/features/profile/features/edit-profile/editProfileConfig';

export const updateProfileSchema = z.object({
	displayName: z
		.string()
		.min(1, 'Le nom ne peut pas être vide')
		.max(PROFILE_LIMITS.DISPLAY_NAME_MAX, `${PROFILE_LIMITS.DISPLAY_NAME_MAX} caractères maximum`),
	bio: z
		.string()
		.max(PROFILE_LIMITS.BIO_MAX, `${PROFILE_LIMITS.BIO_MAX} caractères maximum`)
		.optional()
		.or(z.literal('')),
});

import { z } from 'zod';

export const PROFILE_LIMITS = {
	DISPLAY_NAME_MAX: 15,
	BIO_MAX: 300,
} as const;

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

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

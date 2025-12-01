import { z } from 'zod'

/**
 * Validation schema for updating user profile
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name cannot be empty')
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
})

/**
 * Type inferred from validation schema
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

import { z } from "zod";
import { MAX_GENRES } from "@/features/profile/profile.types";

// =====================================================
// Visibility Level Enum
// =====================================================
const visibilityLevelSchema = z.enum(["public", "friends_only", "private"]);

// =====================================================
// Music Genre Enum
// =====================================================
const musicGenreSchema = z.enum([
  "pop",
  "rock",
  "hiphop",
  "rnb",
  "jazz",
  "classical",
  "electronic",
  "country",
  "latin",
  "metal",
]);

// =====================================================
// Profile Validators
// =====================================================

/**
 * Validation schema for updating user profile
 */
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .max(50, "Display name must be less than 50 characters")
    .optional()
    .refine((val) => val === undefined || val.trim().length > 0, {
      message: "Display name cannot be empty or whitespace only",
    }),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  avatarUrl: z.string().url("Avatar URL must be a valid URL").optional(),
  favoriteArtist: z
    .string()
    .max(100, "Favorite artist must be less than 100 characters")
    .optional(),
});

/**
 * Validation schema for searching users
 */
export const searchUsersSchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

// =====================================================
// Privacy Validators
// =====================================================

/**
 * Validation schema for updating privacy settings
 */
export const updatePrivacySchema = z.object({
  emailVisibility: visibilityLevelSchema.optional(),
  bioVisibility: visibilityLevelSchema.optional(),
  avatarVisibility: visibilityLevelSchema.optional(),
  musicPreferencesVisibility: visibilityLevelSchema.optional(),
});

// =====================================================
// Music Preferences Validators
// =====================================================

/**
 * Validation schema for updating music preferences
 */
export const updateMusicPreferencesSchema = z.object({
  genres: z
    .array(musicGenreSchema)
    .max(MAX_GENRES, `Maximum ${MAX_GENRES} genres allowed`)
    .refine(
      (genres) => new Set(genres).size === genres.length,
      "Duplicate genres are not allowed"
    ),
});

// =====================================================
// Type Exports
// =====================================================

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
export type UpdatePrivacyInput = z.infer<typeof updatePrivacySchema>;
export type UpdateMusicPreferencesInput = z.infer<
  typeof updateMusicPreferencesSchema
>;

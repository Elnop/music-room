/**
 * Response and domain types of the auth feature. Request inputs are inferred
 * from the Zod schemas in auth.validators.ts.
 */

import type { z } from 'zod';
import type { Tables, TablesUpdate } from '@/shared/types/supabase.generated.js';
import type {
	authResultSchema,
	linkedProvidersSchema,
	providerParamSchema,
	userProfileSchema,
} from '@/features/auth/auth.validators.js';

// user_profiles rows (generated Supabase types)
export type UserProfileRow = Tables<'user_profiles'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

export type OAuthProvider = z.infer<typeof providerParamSchema>['provider'];

export interface GoogleTokenPayload {
	sub: string; // Google user ID
	email: string;
	email_verified: boolean;
	name?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
}

export interface FacebookTokenPayload {
	id: string; // Facebook user ID
	email?: string; // Optional - may not be provided if user denies email permission
	name: string;
	picture?: string;
}

// Response bodies, inferred from the schemas the OpenAPI document uses.
export type UserProfile = z.infer<typeof userProfileSchema>;
export type AuthResponse = z.infer<typeof authResultSchema>;
export type LinkedProvidersResponse = z.infer<typeof linkedProvidersSchema>;

/**
 * Supabase Auth User (minimal type for type safety)
 */
export interface SupabaseUser {
	id: string;
	email: string;
	role?: string;
}

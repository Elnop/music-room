import type { z } from 'zod';
import type { Tables, TablesUpdate } from '@/shared/types/supabase.generated.js';
import type {
	authResultSchema,
	linkedProvidersSchema,
	providerParamSchema,
	userProfileSchema,
} from '@/features/auth/auth.validators.js';

export type UserProfileRow = Tables<'user_profiles'>;
export type UserProfileUpdate = TablesUpdate<'user_profiles'>;

export type OAuthProvider = z.infer<typeof providerParamSchema>['provider'];

export interface GoogleTokenPayload {
	sub: string;
	email: string;
	email_verified: boolean;
	name?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
}

export interface FacebookTokenPayload {
	id: string;
	email?: string;
	name: string;
	picture?: string;
}

export type UserProfile = z.infer<typeof userProfileSchema>;
export type AuthResponse = z.infer<typeof authResultSchema>;
export type LinkedProvidersResponse = z.infer<typeof linkedProvidersSchema>;

export interface SupabaseUser {
	id: string;
	email: string;
	role?: string;
}

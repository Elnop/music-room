/**
 * Data Transfer Objects (DTOs) for authentication
 */

import type {
	Tables,
	TablesInsert,
	TablesUpdate,
} from "@/shared/types/supabase.generated.js";

// Database types (now using Supabase generated types)
export type UserProfileRow = Tables<"user_profiles">;
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;

export interface RegisterDTO {
	email: string;
	password: string;
	username: string;
	displayName?: string;
}

export interface LoginDTO {
	email: string;
	password: string;
}

export interface VerifyEmailDTO {
	userId: string;
	code: string;
}

export interface ResendVerificationDTO {
	userId: string;
	email: string;
}

export interface OAuthCallbackDTO {
	code: string;
	state?: string;
}

/**
 * OAuth Provider Types
 */

export type OAuthProvider = "google" | "facebook";

export interface GoogleTokenPayload {
	sub: string; // Google user ID
	email: string;
	email_verified: boolean;
	name?: string;
	picture?: string;
	given_name?: string;
	family_name?: string;
}

export interface GoogleLoginDTO {
	idToken: string; // JWT ID token from Google Sign-In
}

export interface GoogleProfile {
	name: string;
	picture?: string;
}

export interface FacebookTokenPayload {
	id: string; // Facebook user ID
	email?: string; // Optional - may not be provided if user denies email permission
	name: string;
	picture?: string;
}

export interface FacebookLoginDTO {
	accessToken: string; // Access token from Facebook Login
}

export interface FacebookProfile {
	name: string;
	picture?: {
		data: {
			url: string;
		};
	};
}

/**
 * Response types
 */

export interface UserProfile {
	id: string;
	email: string;
	username: string;
	displayName?: string;
	avatarUrl?: string;
	bio?: string;
	createdAt: string;
	updatedAt: string;
	connectedProviders?: {
		hasPassword: boolean;
		hasGoogle: boolean;
		hasFacebook: boolean;
	};
}

export interface AuthResponse {
	user: UserProfile;
	session?: {
		accessToken: string;
		refreshToken: string;
		expiresIn: number;
		expiresAt: number;
	};
	requiresVerification?: boolean;
	message?: string;
}

export interface RefreshTokenDTO {
	refreshToken: string;
}

/**
 * Linked Providers Response
 */
export interface LinkedProvidersResponse {
	providers: {
		type: "password" | OAuthProvider;
		connectedAt: string;
		isPrimary: boolean;
	}[];
}

/**
 * Supabase Auth User (minimal type for type safety)
 */
export interface SupabaseUser {
	id: string;
	email: string;
	role?: string;
}

// DbUserProfile has been replaced by UserProfileRow (from generated types)
// Use UserProfileRow for database operations instead

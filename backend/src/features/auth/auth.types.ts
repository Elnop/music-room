/**
 * Data Transfer Objects (DTOs) for authentication
 */

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
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  };
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

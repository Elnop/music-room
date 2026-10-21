// Mirrors backend LinkedProvidersResponse (backend/src/features/auth/auth.types.ts)
export type OAuthProvider = 'google' | 'facebook';

export interface LinkedProvider {
	type: 'password' | OAuthProvider;
	connectedAt: string;
	isPrimary: boolean;
}

export interface LinkedProvidersResponse {
	providers: LinkedProvider[];
}

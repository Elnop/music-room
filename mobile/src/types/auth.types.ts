import type { User } from './user.types';

// Auth Types (Supabase Auth v2.50.0+)
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: User;
}

// Backend Auth Session Response
export interface BackendAuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

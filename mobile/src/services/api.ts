import type { LoginInput, RegisterInput } from '@utils/validators';
import type { UserProfile } from '@types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

console.log('[API] Using API URL:', API_URL);

/**
 * Standard API Response format (matches backend)
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  meta: {
    timestamp: string;
  };
}

/**
 * Auth response from backend
 */
export interface AuthResponse {
  user: UserProfile;
  session: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
  };
}

/**
 * API Error class
 */
export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data: ApiResponse<T> = await response.json();

    if (!data.success || data.error) {
      throw new ApiError(
        data.error?.message || 'API request failed',
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.details
      );
    }

    if (!data.data) {
      throw new ApiError('No data in response', 'NO_DATA');
    }

    return data.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or parsing errors
    if (error instanceof Error) {
      throw new ApiError(error.message, 'NETWORK_ERROR');
    }

    throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR');
  }
}

/**
 * Auth API
 */
export const authApi = {
  /**
   * Register new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        username: data.username,
        displayName: data.displayName,
      }),
    });
  },

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      }),
    });
  },

  /**
   * Get current user profile
   */
  async getMe(accessToken: string): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({
        refreshToken,
      }),
    });
  },

  /**
   * Logout user
   */
  async logout(accessToken: string): Promise<void> {
    await apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

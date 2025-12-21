import type { UserProfile } from '@types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

console.log('[ProfileAPI] Using API URL:', API_URL);

/**
 * Profile update data
 */
export interface UpdateProfileData {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

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
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
 * Profile API
 */
export const profileApi = {
  /**
   * Update current user's profile
   */
  async updateProfile(
    accessToken: string,
    data: UpdateProfileData
  ): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/profile', accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get current user's profile
   */
  async getOwnProfile(accessToken: string): Promise<UserProfile> {
    return apiRequest<UserProfile>('/api/profile', accessToken, {
      method: 'GET',
    });
  },

  /**
   * Get user profile by ID
   */
  async getUserProfile(
    accessToken: string,
    userId: string
  ): Promise<UserProfile> {
    return apiRequest<UserProfile>(`/api/profile/${userId}`, accessToken, {
      method: 'GET',
    });
  },

  /**
   * Search users by username or display name
   */
  async searchUsers(
    accessToken: string,
    query: string,
    limit = 20
  ): Promise<UserProfile[]> {
    const params = new URLSearchParams({ q: query, limit: limit.toString() });
    return apiRequest<UserProfile[]>(
      `/api/profile/search?${params.toString()}`,
      accessToken,
      { method: 'GET' }
    );
  },
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
  followersCount: number;
  followingCount: number;
}

export interface FriendProfile {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

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

    if (error instanceof Error) {
      throw new ApiError(error.message, 'NETWORK_ERROR');
    }

    throw new ApiError('Unknown error occurred', 'UNKNOWN_ERROR');
  }
}

export interface MyStats {
  followersCount: number;
  followingCount: number;
}

export const friendsApi = {
  async getFriends(accessToken: string): Promise<FriendProfile[]> {
    return apiRequest<FriendProfile[]>('/api/friends', accessToken, {
      method: 'GET',
    });
  },

  async getMyStats(accessToken: string): Promise<MyStats> {
    return apiRequest<MyStats>('/api/friends/stats/me', accessToken, {
      method: 'GET',
    });
  },

  async getFollowStatus(accessToken: string, userId: string): Promise<FollowStatus> {
    return apiRequest<FollowStatus>(`/api/friends/status/${userId}`, accessToken, {
      method: 'GET',
    });
  },

  async followUser(
    accessToken: string,
    userId: string
  ): Promise<{ success: boolean; status: FollowStatus }> {
    return apiRequest<{ success: boolean; status: FollowStatus }>(
      `/api/friends/follow/${userId}`,
      accessToken,
      { method: 'POST' }
    );
  },

  async unfollowUser(
    accessToken: string,
    userId: string
  ): Promise<{ success: boolean; status: FollowStatus }> {
    return apiRequest<{ success: boolean; status: FollowStatus }>(
      `/api/friends/follow/${userId}`,
      accessToken,
      { method: 'DELETE' }
    );
  },
};

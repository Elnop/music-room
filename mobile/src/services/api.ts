import type { LoginInput, RegisterInput } from '@utils/validators';
import type { UserProfile, SpotifyAuthResponse, SpotifyConnectionStatus, SpotifySearchResult } from '@types';

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

    // Check if response is OK (status 200-299)
    if (!response.ok) {
      // Try to parse error response as JSON
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, try to get text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch {
          // Keep default error message
        }
      }
      throw new ApiError(errorMessage, `HTTP_${response.status}`);
    }

    // Parse successful response
    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new ApiError(
        'Invalid JSON response from server',
        'PARSE_ERROR',
        parseError
      );
    }

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

/**
 * Spotify API
 */
export const spotifyApi = {
  /**
   * Initiate Spotify OAuth flow
   */
  async initiateAuth(accessToken: string): Promise<SpotifyAuthResponse> {
    return apiRequest<SpotifyAuthResponse>('/api/spotify/auth/initiate', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string, state: string): Promise<SpotifyConnectionStatus> {
    return apiRequest<SpotifyConnectionStatus>('/api/spotify/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },

  /**
   * Get Spotify connection status
   */
  async getStatus(accessToken: string): Promise<SpotifyConnectionStatus> {
    return apiRequest<SpotifyConnectionStatus>('/api/spotify/auth/status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Disconnect Spotify account
   */
  async disconnect(accessToken: string): Promise<void> {
    return apiRequest<void>('/api/spotify/auth/disconnect', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  /**
   * Search Spotify catalog
   */
  async search(
    accessToken: string,
    query: string,
    type: 'track' | 'album' | 'artist' | 'playlist' = 'track',
    limit: number = 20
  ): Promise<SpotifySearchResult> {
    const params = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
    });

    return apiRequest<SpotifySearchResult>(`/api/spotify/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

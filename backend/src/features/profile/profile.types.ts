/**
 * Profile Feature Types
 */

/**
 * DTO for updating user profile
 */
export interface UpdateProfileDTO {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

/**
 * Profile update response
 */
export interface ProfileUpdateResponse {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

// User Types (aligned with backend)
export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserProfile extends User {
  displayName?: string;
  bio?: string;
  updatedAt: string;
}

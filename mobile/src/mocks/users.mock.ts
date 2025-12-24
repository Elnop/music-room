import type { UserProfile } from '@types';

/**
 * Mock Users
 * Pre-defined user accounts for testing and development
 */

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'user-1',
    email: 'demo@musicroom.com',
    username: 'demo_user',
    displayName: 'Demo User',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    bio: 'Music enthusiast and playlist curator. Love discovering new artists!',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: 'user-2',
    email: 'alice@example.com',
    username: 'alice_music',
    displayName: 'Alice Smith',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    bio: 'Jazz and soul lover. Always vibing to good music.',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z',
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    username: 'bob_beats',
    displayName: 'Bob Johnson',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    bio: 'Electronic music producer and DJ.',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-19T09:15:00Z',
  },
  {
    id: 'user-4',
    email: 'carol@example.com',
    username: 'carol_tunes',
    displayName: 'Carol Williams',
    avatarUrl: 'https://i.pravatar.cc/150?img=4',
    bio: 'Indie rock fan and concert goer.',
    createdAt: '2024-01-14T11:20:00Z',
    updatedAt: '2024-01-21T16:45:00Z',
  },
  {
    id: 'user-5',
    email: 'dave@example.com',
    username: 'dave_melodies',
    displayName: 'Dave Martinez',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    bio: 'Classical music professor and vinyl collector.',
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-22T10:30:00Z',
  },
];

/**
 * Mock Credentials for Login
 * Use these credentials to test the login flow
 */
export const MOCK_CREDENTIALS = {
  email: 'demo@musicroom.com',
  password: 'Demo123!@#',
};

/**
 * Helper: Find user by email
 */
export const findUserByEmail = (email: string): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Helper: Find user by username
 */
export const findUserByUsername = (username: string): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.username.toLowerCase() === username.toLowerCase());
};

/**
 * Helper: Find user by ID
 */
export const findUserById = (id: string): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.id === id);
};

/**
 * Helper: Check if email exists
 */
export const isEmailTaken = (email: string): boolean => {
  return MOCK_USERS.some(user => user.email.toLowerCase() === email.toLowerCase());
};

/**
 * Helper: Check if username exists
 */
export const isUsernameTaken = (username: string): boolean => {
  return MOCK_USERS.some(user => user.username.toLowerCase() === username.toLowerCase());
};

/**
 * Central Route Registry
 *
 * This file centralizes all API route registration to prevent merge conflicts
 * when multiple developers add new features simultaneously.
 *
 * Each feature exports its route configuration from its routes file.
 * Add new routes by importing them here - server.ts stays untouched.
 */

import { Router } from 'express';
import authRoutes from '@/features/auth/auth.routes.js';
import profileRoutes from '@/features/profile/profile.routes.js';
import playlistRoutes from '@/features/playlists/playlist.routes.js';
import soundcloudRoutes from '@/features/soundcloud/soundcloud.routes.js';
import friendsRoutes from '@/features/friends/friends.routes.js';
import musicControlRoutes from '@/features/music-control/music-control.routes.js';

export interface RouteConfig {
	/** API path prefix (e.g., "/api/auth") */
	path: string;
	/** Express router for this feature */
	router: Router;
	/** Optional description for documentation */
	description?: string;
}

/**
 * Registry of all API routes
 *
 * To add a new feature:
 * 1. Import the routes from your feature
 * 2. Add entry to this array
 * 3. No changes needed in server.ts!
 */
export const routes: RouteConfig[] = [
	{
		path: '/api/auth',
		router: authRoutes,
		description: 'Authentication endpoints (register, login, logout, refresh)',
	},
	{
		path: '/api/profile',
		router: profileRoutes,
		description: 'User profile management endpoints',
	},
	{
		path: '/api/playlists',
		router: playlistRoutes,
		description: 'Playlist CRUD and track management endpoints',
	},
	{
		path: '/api/soundcloud',
		router: soundcloudRoutes,
		description: 'SoundCloud music search and streaming endpoints',
	},
	{
		path: '/api/friends',
		router: friendsRoutes,
		description: 'Follow/unfollow and friendship status endpoints',
	},
	{
		path: '/api/music-control',
		router: musicControlRoutes,
		description: 'Music control delegation between friends',
	},
];

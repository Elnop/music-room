import { Router } from 'express';
import authRoutes from '@/features/auth/auth.routes.js';
import profileRoutes from '@/features/profile/profile.routes.js';
import playlistRoutes from '@/features/playlists/playlist.routes.js';
import soundcloudRoutes from '@/features/soundcloud/soundcloud.routes.js';
import friendsRoutes from '@/features/friends/friends.routes.js';
import musicControlRoutes from '@/features/music-control/music-control.routes.js';
import queueRoutes from '@/features/queue/queue.routes.js';
import queueTransferRoutes from '@/features/queue/queue-transfer.routes.js';

interface RouteConfig {
	path: string;
	router: Router;
	description?: string;
}

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
	{
		path: '/api/queue/transfer',
		router: queueTransferRoutes,
		description: "Moves playback to one of the caller's devices or a friend's device",
	},
	{
		path: '/api/queue',
		router: queueRoutes,
		description: "The caller's play queue, synced across their devices",
	},
	{
		path: '/api/users/:userId/queue',
		router: queueRoutes,
		description: "A friend's play queue, for a delegate who controls one of their devices",
	},
];

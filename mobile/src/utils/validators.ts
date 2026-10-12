import { z } from 'zod';

// Auth Validators (aligned with backend Zod schemas)
export const loginSchema = z.object({
	email: z.email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
	email: z.email('Invalid email format'),
	password: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain uppercase letter')
		.regex(/[0-9]/, 'Password must contain number')
		.regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(20, 'Username must be less than 20 characters')
		.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
	displayName: z
		.string()
		.min(1, 'Display name cannot be empty')
		.max(50, 'Display name must be less than 50 characters')
		.optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const playlistFormSchema = z.object({
	name: z.string().min(1, 'Playlist name is required').max(20, 'Name must be 20 characters max'),
	description: z.string().max(70, 'Description must be 70 characters max').optional(),
});

export type PlaylistFormInput = z.infer<typeof playlistFormSchema>;

export interface PlaylistInput extends PlaylistFormInput {
	visibility?: 'public' | 'private';
	editMode?: 'open' | 'restricted';
}

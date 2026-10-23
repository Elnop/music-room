import { z } from 'zod';

export const playlistFormSchema = z.object({
	name: z
		.string()
		.min(1, 'Le nom de la playlist est requis')
		.max(50, 'Le nom doit faire 50 caractères maximum'),
	description: z.string().max(500, 'La description doit faire 500 caractères maximum').optional(),
});

export type PlaylistFormInput = z.infer<typeof playlistFormSchema>;

export interface PlaylistInput extends PlaylistFormInput {
	visibility?: 'public' | 'private';
	editMode?: 'open' | 'restricted';
}

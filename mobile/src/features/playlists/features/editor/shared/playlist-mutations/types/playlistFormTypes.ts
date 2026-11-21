import type { z } from 'zod';
import type { playlistFormSchema } from '@/features/playlists/features/editor/shared/playlist-mutations/playlistSchemas';

export type PlaylistFormInput = z.infer<typeof playlistFormSchema>;

export type PlaylistInput = PlaylistFormInput & {
	visibility?: 'public' | 'private';
	editMode?: 'open' | 'restricted';
};

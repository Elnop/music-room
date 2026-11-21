import { useState } from 'react';
import type { PlaylistSettings } from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';

export function usePlaylistSettings(): PlaylistSettings {
	const [isPrivate, setIsPrivate] = useState(false);
	const [isEditRestricted, setIsEditRestricted] = useState(false);
	return { isPrivate, setIsPrivate, isEditRestricted, setIsEditRestricted };
}

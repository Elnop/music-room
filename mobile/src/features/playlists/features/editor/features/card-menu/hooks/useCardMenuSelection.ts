import { useState } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import type { CardMenuSelection } from '@/features/playlists/features/editor/features/card-menu/cardMenuTypes';

export function useCardMenuSelection(): CardMenuSelection {
	const userId = useSession(session => session.user?.id);
	const [selection, setSelection] = useState<{ playlist: Playlist | null; visible: boolean }>({
		playlist: null,
		visible: false,
	});

	return {
		...selection,
		actionsFor: target =>
			Boolean(userId) && target.ownerId === userId
				? () => setSelection({ playlist: target, visible: true })
				: undefined,
		close: () => setSelection(current => ({ ...current, visible: false })),
	};
}

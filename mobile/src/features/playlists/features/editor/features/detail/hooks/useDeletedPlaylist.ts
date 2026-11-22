import { useRef } from 'react';
import { useLeavePlaylist } from '@/features/playlists/features/editor/features/detail/hooks/useLeavePlaylist';
import { useDeletedElsewhere } from '@/features/playlists/features/editor/features/detail/hooks/useDeletedElsewhere';
import type {
	DeletedPlaylist,
	DetailNavigation,
} from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useDeletedPlaylist(navigation: DetailNavigation, id: string): DeletedPlaylist {
	const deletingRef = useRef(false);
	const deleted = useDeletedElsewhere(navigation, id, deletingRef);
	const leaving = useLeavePlaylist(navigation, id);

	return {
		active: !deleted && !leaving.gone,
		markDeleting: (deleting) => {
			deletingRef.current = deleting;
		},
		leaveDeleted: leaving.leave,
	};
}

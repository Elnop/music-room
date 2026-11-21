import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useSession } from '@/shared/backend/hooks/useSession';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';
import {
	loadMembers,
	updateMembers,
} from '@/features/playlists/features/editor/features/sharing/lib/sharingMembers';
import type { MemberList } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

export function useMembersQuery(id: string): MemberList {
	const client = useQueryClient();
	const signedIn = useSession(session => session.isAuthenticated);
	const query = useQuery({
		queryKey: queryKeys.playlists.members(id),
		queryFn: context => loadMembers(context.client, id),
		enabled: signedIn,
		staleTime: STALE.none,
		gcTime: STALE.none,
		retry: false,
	});
	const { error, refetch } = query;

	useEffect(() => {
		if (!error) return;
		logger.error('[PlaylistSharing] Failed to fetch playlist:', error);
		showError(apiErrorMessage(error, 'Impossible de charger la playlist'));
	}, [error]);

	return {
		members: query.data ?? [],
		isLoading: query.isLoading,
		refetch: useCallback(() => void refetch(), [refetch]),
		setMembers: update => updateMembers(client, id, update),
	};
}

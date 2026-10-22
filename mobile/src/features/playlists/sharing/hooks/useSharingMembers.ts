import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import * as membersApi from '@/features/playlists/services/membersApi';
import * as usersApi from '@/features/playlists/services/usersApi';
import { refreshPlaylist } from '@/features/playlists/utils/playlistCache';
import type { PlaylistMember, UserSummary } from '@/features/playlists/types';

const toMember = (user: UserSummary, canEdit: boolean): PlaylistMember => ({
	id: user.id,
	username: user.username,
	displayName: user.displayName,
	avatarUrl: user.avatarUrl,
	canEdit,
});

/**
 * Reloads the playlist (its failure fails the query), then lists its editors
 * and viewers; a failure of that second part only leaves the list empty.
 */
async function loadMembers(client: QueryClient, id: string): Promise<PlaylistMember[]> {
	const playlist = await refreshPlaylist(client, id);
	try {
		const viewers = await membersApi.getViewers(id);
		const editors = await Promise.all(playlist.collaboratorIds.map(usersApi.getUserProfile));
		const members = [
			...editors.map(e => toMember(e, true)),
			...viewers.map(v => toMember(v, false)),
		];
		return members.filter((member, index) => members.findIndex(m => m.id === member.id) === index);
	} catch (error) {
		logger.error('[PlaylistSharing] Failed to load members:', error);
		return [];
	}
}

export interface SharingMembers {
	members: PlaylistMember[];
	/** The first load: a full-screen spinner. */
	isLoading: boolean;
	/** One member change at a time. */
	busy: boolean;
	refetch: () => void;
	add: (user: UserSummary, asViewer: boolean, canEdit: boolean) => void;
	remove: (userId: string, isPrivate: boolean) => Promise<void>;
}

/** The members of a playlist, changed at once on screen and restored on a refusal. */
export function useSharingMembers(id: string): SharingMembers {
	const client = useQueryClient();
	const signedIn = useSession(session => session.isAuthenticated);
	const key = queryKeys.playlists.members(id);
	// Reloaded with a spinner on every visit, as the screen always did.
	const query = useQuery({
		queryKey: key,
		queryFn: () => loadMembers(client, id),
		enabled: signedIn,
		staleTime: STALE.none,
		gcTime: 0,
		retry: false,
	});
	const [processing, setProcessing] = useState<string | null>(null);
	const { error, refetch } = query;
	const refetchMembers = useCallback(() => void refetch(), [refetch]);

	useEffect(() => {
		if (!error) return;
		logger.error('[PlaylistSharing] Failed to fetch playlist:', error);
		showError(apiErrorMessage(error, 'Impossible de charger la playlist'));
	}, [error]);

	const members = query.data ?? [];
	const setMembers = (update: (list: PlaylistMember[]) => PlaylistMember[]) =>
		client.setQueryData<PlaylistMember[]>(key, list => update(list ?? []));

	const change = useMutation({
		mutationFn: (request: () => Promise<void>) => request(),
	});

	const run = async (userId: string, request: () => Promise<void>) => {
		setProcessing(userId);
		try {
			await change.mutateAsync(request);
		} finally {
			setProcessing(null);
		}
	};

	return {
		members,
		isLoading: query.isLoading,
		busy: processing !== null,
		refetch: refetchMembers,
		add: (user, asViewer, canEdit) => {
			if (processing) return;
			setMembers(list => [...list, toMember(user, canEdit)]);
			run(user.id, () =>
				asViewer ? membersApi.addViewer(id, user.id) : membersApi.addCollaborator(id, user.id)
			).catch(err => {
				setMembers(list => list.filter(m => m.id !== user.id));
				showError(apiErrorMessage(err, "Impossible d'ajouter l'utilisateur"));
			});
		},
		remove: async (userId, isPrivate) => {
			const member = members.find(m => m.id === userId);
			if (processing || !member) return;
			setMembers(list => list.filter(m => m.id !== userId));
			try {
				await run(userId, async () => {
					if (!isPrivate || member.canEdit) await membersApi.removeCollaborator(id, userId);
					// A viewer may not exist, which is fine.
					if (isPrivate) await membersApi.removeViewer(id, userId).catch(() => undefined);
				});
				showSuccess('Utilisateur retiré');
			} catch (err) {
				logger.error('[PlaylistSharing] Remove failed:', err);
				setMembers(() => members);
				showError(apiErrorMessage(err, "Impossible de retirer l'utilisateur"));
			}
		},
	};
}

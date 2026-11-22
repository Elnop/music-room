import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import * as membersApi from '@/features/playlists/features/editor/features/sharing/lib/membersApi';
import { toMember } from '@/features/playlists/features/editor/features/sharing/lib/sharingMembers';
import type { MemberEdits } from '@/features/playlists/features/editor/features/sharing/sharingTypes';
import type { UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';

export function addMember(
	edits: MemberEdits,
	user: UserSummary,
	asViewer: boolean,
	canEdit: boolean,
): void {
	const { id, setMembers } = edits;
	if (edits.processing) return;
	setMembers((list) => [...list, toMember(user, canEdit)]);
	edits
		.run(user.id, () =>
			asViewer ? membersApi.addViewer(id, user.id) : membersApi.addCollaborator(id, user.id),
		)
		.catch((err) => {
			setMembers((list) => list.filter((m) => m.id !== user.id));
			showError(apiErrorMessage(err, "Impossible d'ajouter l'utilisateur"));
		});
}

export async function removeMember(
	edits: MemberEdits,
	userId: string,
	isPrivate: boolean,
): Promise<void> {
	const { id, members, setMembers } = edits;
	const member = members.find((m) => m.id === userId);
	if (edits.processing || !member) return;
	setMembers((list) => list.filter((m) => m.id !== userId));
	try {
		await edits.run(userId, async () => {
			if (!isPrivate || member.canEdit) await membersApi.removeCollaborator(id, userId);
			if (isPrivate) await membersApi.removeViewer(id, userId).catch(() => undefined);
		});
		showSuccess('Utilisateur retiré');
	} catch (err) {
		logger.error('[PlaylistSharing] Remove failed:', err);
		setMembers(() => members);
		showError(apiErrorMessage(err, "Impossible de retirer l'utilisateur"));
	}
}

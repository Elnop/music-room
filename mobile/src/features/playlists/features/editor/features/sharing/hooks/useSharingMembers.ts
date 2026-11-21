import { useMembersQuery } from '@/features/playlists/features/editor/features/sharing/hooks/useMembersQuery';
import { useMemberChange } from '@/features/playlists/features/editor/features/sharing/hooks/useMemberChange';
import {
	addMember,
	removeMember,
} from '@/features/playlists/features/editor/features/sharing/lib/memberEdits';
import type {
	MemberEdits,
	SharingMembers,
} from '@/features/playlists/features/editor/features/sharing/sharingTypes';

export function useSharingMembers(id: string): SharingMembers {
	const list = useMembersQuery(id);
	const { processing, run } = useMemberChange();
	const edits: MemberEdits = {
		id,
		members: list.members,
		setMembers: list.setMembers,
		processing,
		run,
	};

	return {
		members: list.members,
		isLoading: list.isLoading,
		busy: processing !== null,
		refetch: list.refetch,
		add: (user, asViewer, canEdit) => addMember(edits, user, asViewer, canEdit),
		remove: (userId, isPrivate) => removeMember(edits, userId, isPrivate),
	};
}

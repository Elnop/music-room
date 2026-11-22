import { useCallback, useState } from 'react';
import { showError } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { useToggleControlMutation } from '@/features/user/features/friends/shared/follows/hooks/useFriendsMutations';

export function useToggleControl() {
	const toggleMutation = useToggleControlMutation();
	const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

	const onToggleControl = useCallback(
		async (friendId: string, currentValue: boolean) => {
			setTogglingUserId(friendId);
			try {
				await toggleMutation.mutateAsync({ userId: friendId, shouldGrant: !currentValue });
			} catch (err) {
				logger.error('[FriendsList] Failed to toggle control:', err);
				showError(apiErrorMessage(err, 'Impossible de modifier les permissions'));
			} finally {
				setTogglingUserId(null);
			}
		},
		[toggleMutation],
	);

	return { togglingUserId, onToggleControl };
}

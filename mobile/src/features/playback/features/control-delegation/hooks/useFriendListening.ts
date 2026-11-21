import { useMemo } from 'react';
import { useControllableDevices } from '@/features/playback/features/control-delegation/hooks/useControllableDevices';
import { useListeningStatuses } from '@/features/playback/features/control-delegation/hooks/useListeningStatuses';
import { useRemoteActions } from '@/features/playback/features/control-delegation/hooks/useRemoteActions';
import { friendDevices } from '@/features/playback/features/control-delegation/lib/friendDevices';
import type { FriendListeningResult } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export function useFriendListening(targetUserId: string | null): FriendListeningResult {
	const control = useControllableDevices(targetUserId);
	const listening = useListeningStatuses(targetUserId, control.canControl);
	const { remotePlay, remotePause } = useRemoteActions(targetUserId, control.isControllable);

	const devices = useMemo(
		() => friendDevices(listening.statuses, control.canControl, control.isControllable),
		[listening.statuses, control.canControl, control.isControllable]
	);

	return {
		devices,
		canControl: control.canControl,
		isLoading: listening.isLoading,
		error: listening.error,
		controlError: control.controlError,
		remotePlay,
		remotePause,
	};
}

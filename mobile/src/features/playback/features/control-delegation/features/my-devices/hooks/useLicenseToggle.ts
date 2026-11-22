import { useCallback, useState } from 'react';
import { showError } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import {
	pairKey,
	setPair,
} from '@/features/playback/features/control-delegation/features/my-devices/lib/devicePermissions';
import { requestLicense } from '@/features/playback/features/control-delegation/features/my-devices/lib/requestLicense';
import type { PairUpdate } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';
import type {
	FriendUserSummary,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export function useLicenseToggle(updateLicensed: (update: PairUpdate) => void) {
	const [pending, setPending] = useState<Set<string>>(new Set());

	const onToggle = useCallback(
		async (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => {
			const key = pairKey(device.deviceId, friend.id);
			setPending((current) => setPair(current, key, true));
			updateLicensed((current) => setPair(current, key, grant));
			try {
				await requestLicense(device, friend, grant);
			} catch (error) {
				updateLicensed((current) => setPair(current, key, !grant));
				const fallback = grant ? "Impossible d'accorder l'accès" : "Impossible de retirer l'accès";
				showError(apiErrorMessage(error, fallback));
			} finally {
				setPending((current) => setPair(current, key, false));
			}
		},
		[updateLicensed],
	);

	return { pending, onToggle };
}

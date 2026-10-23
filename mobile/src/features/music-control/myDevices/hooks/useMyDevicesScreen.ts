import { useState, useEffect, useCallback } from 'react';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { getSession } from '@/shared/services/authSession';
import { musicControlApi } from '@/features/music-control/services/musicControlApi';
import { getFriends, type FriendUserSummary } from '@/shared/services/friendsBridge';
import { deviceService } from '@/shared/services/deviceService';
import { showError, showSuccess } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import type { UserDeviceWithLicenses } from '@/features/music-control/types';
import {
	pairKey,
	setPair,
	friendName,
	licensedPairs,
} from '@/features/music-control/myDevices/utils/devicePermissions';

const LOAD_ERROR = 'Impossible de charger vos appareils';

export function useMyDevicesScreen() {
	const navigation = useNavigation<NavigationProp<{ FriendsTab: undefined }>>();
	const bottomPadding = useBottomPadding();

	const [isLoading, setIsLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const [devices, setDevices] = useState<UserDeviceWithLicenses[]>([]);
	const [friends, setFriends] = useState<FriendUserSummary[]>([]);
	const [allDevicesIds, setAllDevicesIds] = useState<Set<string>>(new Set());
	const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
	const [licensed, setLicensed] = useState<Set<string>>(new Set());
	const [pending, setPending] = useState<Set<string>>(new Set());

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [renaming, setRenaming] = useState<UserDeviceWithLicenses | null>(null);
	const [isRenameSaving, setIsRenameSaving] = useState(false);

	const load = useCallback(async (isRefresh: boolean) => {
		try {
			const accessToken = getSession().accessToken;
			if (!accessToken) throw new Error(LOAD_ERROR);
			const [myDevices, myFriends, allowedIds, deviceInfo] = await Promise.all([
				musicControlApi.getMyDevices(),
				getFriends(accessToken),
				musicControlApi.getMyPermissions(),
				deviceService.getDeviceInfo().catch(() => null),
			]);
			setDevices(myDevices);
			setFriends(myFriends);
			setAllDevicesIds(new Set(allowedIds));
			setCurrentDeviceId(deviceInfo?.deviceId ?? null);
			setLicensed(licensedPairs(myDevices));
			setLoadFailed(false);
		} catch (error) {
			if (!isRefresh) setLoadFailed(true);
			showError(apiErrorMessage(error, LOAD_ERROR));
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		void Promise.resolve().then(async () => {
			await load(false);
			if (isMounted) setIsLoading(false);
		});
		return () => {
			isMounted = false;
		};
	}, [load]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await load(true);
		setIsRefreshing(false);
	}, [load]);

	const handleToggle = useCallback(
		async (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => {
			const key = pairKey(device.deviceId, friend.id);
			setPending(current => setPair(current, key, true));
			setLicensed(current => setPair(current, key, grant));
			try {
				if (grant) {
					await musicControlApi.grantDeviceLicense(device.deviceId, friend.id);
					showSuccess(`${friendName(friend)} peut contrôler ${device.deviceName}`);
				} else {
					await musicControlApi.revokeDeviceLicense(device.deviceId, friend.id);
					showSuccess(`${friendName(friend)} ne contrôle plus ${device.deviceName}`);
				}
			} catch (error) {
				setLicensed(current => setPair(current, key, !grant));
				showError(
					apiErrorMessage(
						error,
						grant ? "Impossible d'accorder l'accès" : "Impossible de retirer l'accès"
					)
				);
			} finally {
				setPending(current => setPair(current, key, false));
			}
		},
		[]
	);

	const handleRename = useCallback(
		async (name: string | null) => {
			if (!renaming) return;
			setIsRenameSaving(true);
			try {
				await musicControlApi.renameDevice(renaming.deviceId, name);
				setRenaming(null);
				showSuccess('Appareil renommé');
				await load(true);
			} catch (error) {
				showError(apiErrorMessage(error, "Impossible de renommer l'appareil"));
			} finally {
				setIsRenameSaving(false);
			}
		},
		[renaming, load]
	);

	return {
		isLoading,
		loadFailed,
		isRefreshing,
		bottomPadding,
		devices,
		friends,
		allDevicesIds,
		currentDeviceId,
		licensed,
		pending,
		renamingDevice: renaming,
		isRenameSaving,
		pairKey,
		onRefresh: handleRefresh,
		onToggle: handleToggle,
		onOpenRename: (device: UserDeviceWithLicenses) => setRenaming(device),
		onCloseRename: () => {
			if (!isRenameSaving) setRenaming(null);
		},
		onSubmitRename: handleRename,
		onNavigateFriends: () => navigation.navigate('FriendsTab'),
	};
}

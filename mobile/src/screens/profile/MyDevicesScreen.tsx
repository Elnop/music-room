import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { AppTabsParamList } from '@/navigation/AppNavigator';
import { usePlayerHeight } from '@/features/player/context/PlayerContext';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import type { UserDeviceWithLicenses } from '@/types/device.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { musicControlApi } from '@/services/musicControlApi';
import { friendsApi, type FriendProfile } from '@/services/friendsApi';
import { deviceService } from '@/services/deviceService';
import { SkeletonBlock, SkeletonList } from '@/shared/components/ui/Skeleton';
import { Avatar } from '@/shared/components/media/Avatar';
import { showError, showSuccess } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { RenameDeviceModal } from '@/components/music-control/RenameDeviceModal';

const LOAD_ERROR = 'Impossible de charger vos appareils';

/** Key of one device+friend pair in the license and pending sets */
const pairKey = (deviceId: string, userId: string): string => `${deviceId}|${userId}`;

/** Copy of `set` with `key` added or removed */
function setPair(set: Set<string>, key: string, on: boolean): Set<string> {
	const next = new Set(set);
	if (on) next.add(key);
	else next.delete(key);
	return next;
}

function friendName(friend: FriendProfile): string {
	return friend.displayName || friend.username;
}

/** The model repeats the device name when the device was never renamed (the default name). */
function sameName(model: string, deviceName: string): boolean {
	return model.trim().toLowerCase() === deviceName.trim().toLowerCase();
}

function formatLastSeen(lastSeenAt: string): string {
	const date = new Date(lastSeenAt);
	if (Number.isNaN(date.getTime())) return '';
	return `Vu le ${date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

function licensedPairs(devices: UserDeviceWithLicenses[]): Set<string> {
	const pairs = new Set<string>();
	for (const device of devices) {
		for (const license of device.licenses) {
			pairs.add(pairKey(device.deviceId, license.user.id));
		}
	}
	return pairs;
}

/** Same shape as a device card: icon, name and meta lines, then friend rows. */
function DeviceCardSkeleton() {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	return (
		<View style={styles.card}>
			<View style={styles.deviceHeader}>
				<SkeletonBlock width={40} height={40} radius={20} style={styles.skeletonIcon} />
				<View style={styles.textContainer}>
					<SkeletonBlock width="55%" height={16} />
					<SkeletonBlock width="40%" height={12} style={styles.skeletonLine} />
				</View>
			</View>
			<View style={styles.divider} />
			{[0, 1].map(index => (
				<View key={index} style={styles.friendRow}>
					<SkeletonBlock width={32} height={32} radius={16} />
					<View style={styles.textContainer}>
						<SkeletonBlock width="45%" height={14} />
					</View>
					<SkeletonBlock width={51} height={31} radius={16} />
				</View>
			))}
		</View>
	);
}

export function MyDevicesScreen() {
	const { theme } = useTheme();
	const navigation = useNavigation<NavigationProp<AppTabsParamList>>();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const [isLoading, setIsLoading] = useState(true);
	const [loadFailed, setLoadFailed] = useState(false);
	const [devices, setDevices] = useState<UserDeviceWithLicenses[]>([]);
	const [friends, setFriends] = useState<FriendProfile[]>([]);
	const [allDevicesIds, setAllDevicesIds] = useState<Set<string>>(new Set());
	const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
	const [licensed, setLicensed] = useState<Set<string>>(new Set());
	const [pending, setPending] = useState<Set<string>>(new Set());

	const [isRefreshing, setIsRefreshing] = useState(false);
	const [renaming, setRenaming] = useState<UserDeviceWithLicenses | null>(null);
	const [isRenameSaving, setIsRenameSaving] = useState(false);

	// Loads devices, friends and permissions. A failed refresh keeps what is shown.
	const load = useCallback(async (isRefresh: boolean) => {
		try {
			// Read once: a token refresh must not reload the screen
			const accessToken = useAuthStore.getState().accessToken;
			if (!accessToken) throw new Error(LOAD_ERROR);
			const [myDevices, myFriends, allowedIds, deviceInfo] = await Promise.all([
				musicControlApi.getMyDevices(),
				friendsApi.getFriends(accessToken),
				musicControlApi.getMyPermissions(),
				// Only marks "Cet appareil": a failure must not hide the list
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
		const firstLoad = async () => {
			await load(false);
			setIsLoading(false);
		};
		firstLoad();
	}, [load]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await load(true);
		setIsRefreshing(false);
	}, [load]);

	const handleToggle = useCallback(
		async (device: UserDeviceWithLicenses, friend: FriendProfile, grant: boolean) => {
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

	// Renames the device in the modal (#352); null goes back to the system name.
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

	const refreshControl = (
		<RefreshControl
			refreshing={isRefreshing}
			onRefresh={handleRefresh}
			tintColor={theme.colors.primary}
			colors={[theme.colors.primary]}
		/>
	);

	const header = (
		<View style={styles.header}>
			<Text style={styles.subtitle}>
				Choisissez quels amis peuvent contrôler la musique de chaque appareil
			</Text>
		</View>
	);

	if (isLoading) {
		return (
			<View style={styles.container}>
				<ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
					{header}
					<SkeletonList count={2} row={DeviceCardSkeleton} />
				</ScrollView>
			</View>
		);
	}

	if (loadFailed) {
		return (
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.centered} refreshControl={refreshControl}>
					<Text style={styles.errorText}>{LOAD_ERROR}</Text>
				</ScrollView>
			</View>
		);
	}

	const renderFriendRow = (device: UserDeviceWithLicenses, friend: FriendProfile) => {
		const key = pairKey(device.deviceId, friend.id);
		const allDevices = allDevicesIds.has(friend.id);
		const isPending = pending.has(key);
		const value = allDevices || licensed.has(key);
		const name = friendName(friend);

		return (
			<View key={friend.id} style={styles.friendRow} testID={`license-row-${key}`}>
				<Avatar size="sm" name={name} uri={friend.avatarUrl} />
				<View style={styles.textContainer}>
					<Text style={styles.friendName}>{name}</Text>
					{allDevices && <Text style={styles.hint}>Contrôle tous mes appareils</Text>}
				</View>
				<ThemedSwitch
					value={value}
					onValueChange={next => handleToggle(device, friend, next)}
					disabled={allDevices || isPending}
					accessibilityLabel={`${name} sur ${device.deviceName}`}
					accessibilityState={{ disabled: allDevices || isPending, busy: isPending }}
				/>
			</View>
		);
	};

	const renderDevice = (device: UserDeviceWithLicenses) => {
		const isCurrent = device.deviceId === currentDeviceId;
		const lastSeen = formatLastSeen(device.lastSeenAt);
		const icon = device.platform === 'web' ? 'desktop-outline' : 'phone-portrait-outline';

		return (
			<View key={device.deviceId} style={styles.card} testID={`device-${device.deviceId}`}>
				<View style={styles.deviceHeader}>
					<View style={styles.iconContainer}>
						<Ionicons name={icon} size={20} color={theme.colors.primary} />
					</View>
					<View style={styles.textContainer}>
						<View style={styles.titleRow}>
							<Text style={styles.deviceName}>{device.deviceName}</Text>
							{isCurrent && (
								<View style={styles.badge}>
									<Text style={styles.badgeText}>Cet appareil</Text>
								</View>
							)}
						</View>
						<Text style={styles.deviceMeta}>
							{[sameName(device.model, device.deviceName) ? null : device.model, lastSeen]
								.filter(Boolean)
								.join(' · ')}
						</Text>
					</View>
					<TouchableOpacity
						onPress={() => setRenaming(device)}
						accessibilityRole="button"
						accessibilityLabel={`Renommer l'appareil ${device.deviceName}`}
						hitSlop={8}
						style={styles.renameButton}
					>
						<Ionicons name="create-outline" size={20} color={theme.colors.textSecondary} />
					</TouchableOpacity>
				</View>
				<View style={styles.divider} />
				{friends.length === 0 ? (
					<EmptyState
						style={styles.emptyState}
						message="Aucun ami pour l'instant. Suivez des personnes qui vous suivent en retour : elles deviendront vos amis et vous pourrez leur confier cet appareil."
						action={{
							label: 'Trouver des amis',
							onPress: () => navigation.navigate('FriendsTab'),
						}}
					/>
				) : (
					friends.map(friend => renderFriendRow(device, friend))
				)}
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={[styles.content, { paddingBottom: playerHeight + theme.spacing.xl }]}
				refreshControl={refreshControl}
			>
				{header}

				{devices.length === 0 ? (
					<EmptyState
						icon="phone-portrait-outline"
						style={styles.emptyState}
						message="Aucun appareil. Ouvrez Zumik sur un appareil pour le voir ici."
					/>
				) : (
					devices.map(renderDevice)
				)}
			</ScrollView>
			<RenameDeviceModal
				deviceName={renaming?.deviceName ?? null}
				saving={isRenameSaving}
				onClose={() => {
					if (!isRenameSaving) setRenaming(null);
				}}
				onSubmit={handleRename}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		scrollView: {
			flex: 1,
		},
		content: {
			padding: theme.spacing.lg,
		},
		header: {
			marginBottom: theme.spacing.xl,
		},
		subtitle: {
			fontSize: 16,
			color: theme.colors.textSecondary,
		},
		card: {
			backgroundColor: theme.colors.surface,
			borderRadius: 16,
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.sm,
			marginBottom: theme.spacing.lg,
		},
		deviceHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		iconContainer: {
			width: 40,
			height: 40,
			borderRadius: 20,
			backgroundColor: theme.colors.primary + '15',
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
		},
		textContainer: {
			flex: 1,
			marginRight: theme.spacing.sm,
		},
		titleRow: {
			flexDirection: 'row',
			alignItems: 'center',
			flexWrap: 'wrap',
		},
		deviceName: {
			fontSize: 16,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginRight: theme.spacing.sm,
		},
		renameButton: {
			padding: theme.spacing.xs,
		},
		badge: {
			backgroundColor: theme.colors.primary + '25',
			borderRadius: 8,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
		},
		badgeText: {
			fontSize: 12,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.primary,
		},
		deviceMeta: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
			marginVertical: theme.spacing.xs,
		},
		friendRow: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
			gap: theme.spacing.md,
		},
		friendName: {
			fontSize: 15,
			color: theme.colors.text,
		},
		hint: {
			fontSize: 12,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		emptyState: {
			flex: 0,
			padding: theme.spacing.md,
		},
		skeletonIcon: {
			marginRight: theme.spacing.md,
		},
		skeletonLine: {
			marginTop: 6,
		},
		centered: {
			flexGrow: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		errorText: {
			fontSize: 16,
			color: theme.colors.error,
			textAlign: 'center',
		},
	});

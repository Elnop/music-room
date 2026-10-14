import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import type { UserDeviceWithLicenses } from '@/types/device.types';
import { useAuthStore } from '@/store/authStore';
import { musicControlApi } from '@/services/musicControlApi';
import { friendsApi, type FriendProfile } from '@/services/friendsApi';
import { deviceService } from '@/services/deviceService';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Avatar } from '@components/common/Avatar';
import { showError, showSuccess } from '@utils/toast';

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

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}

function friendName(friend: FriendProfile): string {
	return friend.displayName || friend.username;
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

export function MyDevicesScreen() {
	const { theme } = useTheme();
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

	useEffect(() => {
		const load = async () => {
			setIsLoading(true);
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
				setLoadFailed(true);
				showError(errorMessage(error, LOAD_ERROR));
			} finally {
				setIsLoading(false);
			}
		};

		load();
	}, []);

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
					errorMessage(
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

	if (isLoading) {
		return <LoadingSpinner fullScreen message="Chargement..." />;
	}

	if (loadFailed) {
		return (
			<View style={styles.container}>
				<View style={styles.centered}>
					<Text style={styles.errorText}>{LOAD_ERROR}</Text>
				</View>
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
				<Switch
					value={value}
					onValueChange={next => handleToggle(device, friend, next)}
					disabled={allDevices || isPending}
					accessibilityLabel={`${name} sur ${device.deviceName}`}
					accessibilityState={{ disabled: allDevices || isPending, busy: isPending }}
					trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
					thumbColor={theme.colors.surface}
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
							{[device.model, lastSeen].filter(Boolean).join(' · ')}
						</Text>
					</View>
				</View>
				<View style={styles.divider} />
				{friends.length === 0 ? (
					<Text style={styles.emptyText}>
						Aucun ami pour l&apos;instant. Ajoutez des amis pour leur confier cet appareil.
					</Text>
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
			>
				<View style={styles.header}>
					<Text style={styles.title}>Mes appareils</Text>
					<Text style={styles.subtitle}>
						Choisissez quels amis peuvent contrôler la musique de chaque appareil
					</Text>
				</View>

				{devices.length === 0 ? (
					<Text style={styles.emptyText}>
						Aucun appareil. Ouvrez Zumik sur un appareil pour le voir ici.
					</Text>
				) : (
					devices.map(renderDevice)
				)}
			</ScrollView>
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
		title: {
			fontSize: 28,
			fontWeight: theme.typography.weights.bold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xs,
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
		emptyText: {
			fontSize: 14,
			color: theme.colors.textSecondary,
			textAlign: 'center',
			paddingVertical: theme.spacing.md,
		},
		centered: {
			flex: 1,
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

import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	Modal,
	ScrollView,
	ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { AppToast } from '@/components/common/AppToast';
import type { Theme } from '@/themes/types';
import { musicControlApi } from '@/services/musicControlApi';
import { deviceService } from '@/services/deviceService';
import { useConnectStore } from '@/store/connectStore';
import { transferTo } from '@/store/transferPlayback';
import type { DevicePickerOwner } from '@/types/device.types';
import { logger } from '@/utils/logger';

interface DevicePickerSheetProps {
	visible: boolean;
	onClose: () => void;
}

type PickerDevice = DevicePickerOwner['devices'][number];

interface Loaded {
	owners: DevicePickerOwner[];
	phoneId: string;
}

const deviceIcon = (platform: string): keyof typeof Ionicons.glyphMap =>
	platform === 'web' ? 'desktop-outline' : 'phone-portrait-outline';

/**
 * Spotify Connect-style device picker over the player (#298): this phone, my
 * other devices, then my friends' devices I may control. Offline devices are
 * greyed out; the active one is marked. A tap moves what plays to the device
 * (`transferTo`) and closes the sheet once it succeeded.
 */
export function DevicePickerSheet({ visible, onClose }: DevicePickerSheetProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createStyles(theme, insets), [theme, insets]);
	const target = useConnectStore(state => state.target);

	const [loaded, setLoaded] = React.useState<Loaded | null>(null);
	const [loading, setLoading] = React.useState(visible);
	const [loadError, setLoadError] = React.useState(false);
	/** Bumped by « Réessayer » to load the list again. */
	const [attempt, setAttempt] = React.useState(0);
	const [pendingKey, setPendingKey] = React.useState<string | null>(null);
	const pendingRef = React.useRef(false);

	// Each opening loads a fresh list (devices go on and offline).
	const [wasVisible, setWasVisible] = React.useState(visible);
	if (wasVisible !== visible) {
		setWasVisible(visible);
		if (visible) {
			setLoaded(null);
			setLoading(true);
			setLoadError(false);
		}
	}

	React.useEffect(() => {
		if (!visible) return;
		let cancelled = false;
		Promise.all([musicControlApi.getDevicePicker(), deviceService.getDeviceInfo()])
			.then(([picker, info]) => {
				if (!cancelled) setLoaded({ owners: picker.owners, phoneId: info.deviceId });
			})
			.catch(error => {
				logger.error('[DevicePickerSheet] Loading devices failed:', error);
				if (!cancelled) setLoadError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [visible, attempt]);

	const retry = () => {
		setLoading(true);
		setLoadError(false);
		setAttempt(count => count + 1);
	};

	const isActive = (owner: DevicePickerOwner, deviceId: string): boolean =>
		target.kind === 'local'
			? owner.isSelf && deviceId === loaded?.phoneId
			: target.ownerId === owner.ownerId && target.deviceId === deviceId;

	const handlePick = async (owner: DevicePickerOwner, device: PickerDevice) => {
		if (pendingRef.current || !device.online || isActive(owner, device.deviceId)) return;
		pendingRef.current = true;
		setPendingKey(`${owner.ownerId}:${device.deviceId}`);
		try {
			if (await transferTo(owner, device.deviceId)) onClose();
		} finally {
			pendingRef.current = false;
			setPendingKey(null);
		}
	};

	const renderDevice = (owner: DevicePickerOwner, device: PickerDevice) => {
		const key = `${owner.ownerId}:${device.deviceId}`;
		const active = isActive(owner, device.deviceId);
		const disabled = !device.online || pendingKey !== null;
		const name = device.deviceName;
		return (
			<TouchableOpacity
				key={key}
				testID={`picker-device-${device.deviceId}`}
				style={[styles.row, !device.online && styles.offlineRow]}
				onPress={() => void handlePick(owner, device)}
				disabled={disabled}
				activeOpacity={0.7}
				accessibilityRole="button"
				accessibilityLabel={name}
				accessibilityState={{ disabled, selected: active }}
			>
				<View style={styles.iconContainer}>
					<Ionicons
						name={deviceIcon(device.platform)}
						size={20}
						color={active ? theme.colors.primary : theme.colors.text}
					/>
				</View>
				<View style={styles.rowText}>
					<Text style={[styles.deviceName, active && styles.activeText]} numberOfLines={1}>
						{name}
					</Text>
					<Text style={styles.deviceModel} numberOfLines={1}>
						{device.online ? device.model : 'Hors ligne'}
					</Text>
				</View>
				{pendingKey === key ? (
					<ActivityIndicator size="small" color={theme.colors.primary} />
				) : (
					active && <Text style={styles.activeBadge}>En cours</Text>
				)}
			</TouchableOpacity>
		);
	};

	const renderContent = () => {
		if (loading && !loaded) {
			return (
				<View style={styles.centered}>
					<ActivityIndicator testID="picker-loading" size="large" color={theme.colors.primary} />
				</View>
			);
		}
		if (loadError || !loaded) {
			return (
				<View style={styles.centered}>
					<Text style={styles.errorText}>Impossible de charger les appareils</Text>
					<TouchableOpacity
						style={styles.retryButton}
						onPress={retry}
						hitSlop={4}
						accessibilityRole="button"
					>
						<Text style={styles.retryText}>Réessayer</Text>
					</TouchableOpacity>
				</View>
			);
		}

		const self = loaded.owners.find(owner => owner.isSelf);
		const friends = loaded.owners.filter(owner => !owner.isSelf);
		const phone = self?.devices.find(device => device.deviceId === loaded.phoneId);
		const myOthers = self?.devices.filter(device => device.deviceId !== loaded.phoneId) ?? [];

		return (
			<ScrollView contentContainerStyle={styles.listContent}>
				<Text style={styles.sectionLabel}>Ce téléphone</Text>
				{self && phone ? (
					renderDevice(self, phone)
				) : (
					<Text style={styles.emptyText}>Ce téléphone n&apos;est pas encore enregistré</Text>
				)}

				<Text style={styles.sectionLabel}>Mes appareils</Text>
				{self && myOthers.length > 0 ? (
					myOthers.map(device => renderDevice(self, device))
				) : (
					<Text style={styles.emptyText}>Aucun autre appareil</Text>
				)}

				<Text style={styles.sectionLabel}>Appareils de mes amis</Text>
				{friends.length > 0 ? (
					friends.map(owner => (
						<View key={owner.ownerId}>
							<Text style={styles.ownerName}>{owner.username}</Text>
							{owner.devices.map(device => renderDevice(owner, device))}
						</View>
					))
				) : (
					<Text style={styles.emptyText}>Aucun appareil d&apos;ami à contrôler</Text>
				)}
			</ScrollView>
		);
	};

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="overFullScreen"
			transparent
			onRequestClose={onClose}
		>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity
						onPress={onClose}
						style={styles.closeButton}
						activeOpacity={0.7}
						hitSlop={4}
						accessibilityRole="button"
						accessibilityLabel="Fermer le choix d'appareil"
					>
						<Ionicons name="chevron-down" size={24} color={theme.colors.text} />
					</TouchableOpacity>
					<Text style={styles.title}>Choisir un appareil</Text>
				</View>

				{renderContent()}

				{/* The app root's toast sits behind native modals: transfer errors show here. */}
				<AppToast />
			</View>
		</Modal>
	);
}

const createStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
			paddingTop: insets.top,
		},
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 12,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		closeButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
		title: {
			flex: 1,
			marginRight: 40,
			textAlign: 'center',
			fontSize: 18,
			fontWeight: '700',
			color: theme.colors.text,
		},
		listContent: {
			paddingBottom: insets.bottom + 16,
		},
		centered: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			padding: 24,
			gap: 16,
		},
		errorText: {
			fontSize: 15,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
		retryButton: {
			paddingHorizontal: 20,
			paddingVertical: 10,
			borderRadius: 20,
			backgroundColor: theme.colors.primary,
		},
		retryText: {
			color: theme.colors.textInverse,
			fontWeight: '600',
		},
		sectionLabel: {
			paddingHorizontal: 16,
			paddingTop: 16,
			paddingBottom: 8,
			fontSize: 12,
			fontWeight: '600',
			letterSpacing: 1,
			textTransform: 'uppercase',
			color: theme.colors.textSecondary,
		},
		ownerName: {
			paddingHorizontal: 16,
			paddingTop: 8,
			paddingBottom: 4,
			fontSize: 14,
			fontWeight: '700',
			color: theme.colors.text,
		},
		emptyText: {
			paddingHorizontal: 16,
			paddingVertical: 8,
			color: theme.colors.textSecondary,
		},
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: 16,
			paddingVertical: 12,
			gap: 12,
		},
		offlineRow: {
			opacity: 0.4,
		},
		iconContainer: {
			width: 36,
			height: 36,
			borderRadius: 18,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
		},
		rowText: {
			flex: 1,
		},
		deviceName: {
			fontSize: 16,
			fontWeight: '600',
			color: theme.colors.text,
		},
		activeText: {
			color: theme.colors.primary,
		},
		deviceModel: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		activeBadge: {
			fontSize: 12,
			fontWeight: '700',
			color: theme.colors.primary,
		},
	});

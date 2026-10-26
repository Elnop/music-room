import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import { FullScreenSheet } from '@/shared/components/layout/FullScreenSheet';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { AppToast } from '@/shared/components/feedback/AppToast';
import { THIS_DEVICE_LABEL } from '@/shared/constants/platform';
import { DeviceRow } from './DeviceRow';
import type { DevicePickerOwner } from '@/types/device.types';
import type { Theme } from '@/shared/theme/types';
import type { createPickerStyles } from './devicePickerStyles';
import type { LoadedDevices } from '@/features/queue/devicePicker/hooks/useDevicePicker';
import type { PickerDevice } from './DeviceRow';
import { Text } from '@/shared/components/ui/Text';

interface DevicePickerSheetViewProps {
	visible: boolean;
	onClose: () => void;
	theme: Theme;
	styles: ReturnType<typeof createPickerStyles>;
	loaded: LoadedDevices | null;
	loading: boolean;
	loadError: boolean;
	pendingKey: string | null;
	retry: () => void;
	isActive: (owner: DevicePickerOwner, deviceId: string) => boolean;
	onPick: (owner: DevicePickerOwner, device: PickerDevice) => void;
}

export function DevicePickerSheetView({
	visible,
	onClose,
	theme,
	styles,
	loaded,
	loading,
	loadError,
	pendingKey,
	retry,
	isActive,
	onPick,
}: DevicePickerSheetViewProps) {
	const { isWide } = useBreakpoint();

	const renderDevice = (owner: DevicePickerOwner, device: PickerDevice) => (
		<DeviceRow
			key={`${owner.ownerId}:${device.deviceId}`}
			owner={owner}
			device={device}
			active={isActive(owner, device.deviceId)}
			isPending={pendingKey === `${owner.ownerId}:${device.deviceId}`}
			disabled={!device.online || pendingKey !== null}
			theme={theme}
			styles={styles}
			onPick={onPick}
		/>
	);

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
					<Pressable
						style={styles.retryButton}
						onPress={retry}
						hitSlop={4}
						accessibilityRole="button"
						accessibilityLabel="Réessayer"
					>
						<Text style={styles.retryText}>Réessayer</Text>
					</Pressable>
				</View>
			);
		}

		const self = loaded.owners.find(owner => owner.isSelf);
		const friends = loaded.owners.filter(owner => !owner.isSelf);
		const phone = self?.devices.find(device => device.deviceId === loaded.phoneId);
		const myOthers = self?.devices.filter(device => device.deviceId !== loaded.phoneId) ?? [];

		return (
			<ScrollView contentContainerStyle={styles.listContent}>
				<Text style={styles.sectionLabel}>{THIS_DEVICE_LABEL}</Text>
				{self && phone ? (
					renderDevice(self, phone)
				) : (
					<Text style={styles.emptyText}>{`${THIS_DEVICE_LABEL} n'est pas encore enregistré`}</Text>
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

	const content = (
		<View style={styles.container}>
			<View style={styles.header}>
				<Pressable
					onPress={onClose}
					style={styles.closeButton}
					hitSlop={4}
					accessibilityRole="button"
					accessibilityLabel="Fermer le choix d'appareil"
				>
					<Ionicons name={isWide ? 'close' : 'chevron-down'} size={24} color={theme.colors.text} />
				</Pressable>
				<Text style={styles.title}>Choisir un appareil</Text>
			</View>

			{renderContent()}

			<AppToast />
		</View>
	);

	return (
		<FullScreenSheet visible={visible} onClose={onClose}>
			{content}
		</FullScreenSheet>
	);
}

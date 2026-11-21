import React from 'react';
import { View, StyleSheet } from 'react-native';
import LaptopSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/laptop-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/lib/types';
import {
	sameName,
	formatLastSeen,
} from '@/features/playback/features/control-delegation/features/my-devices/lib/deviceFormatters';
import { Text } from '@/shared/theme/components/Text';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

interface DeviceHeaderProps {
	device: UserDeviceWithLicenses;
	isCurrent: boolean;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
}

export function DeviceHeader({ device, isCurrent, onOpenRename }: DeviceHeaderProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const lastSeen = formatLastSeen(device.lastSeenAt);
	const icon = device.platform === 'web' ? LaptopSolid : PhoneRingingLowSolid;

	return (
		<View style={styles.deviceHeader}>
			<View style={styles.iconWrapper}>
				<PixelIcon icon={icon} size={20} color={theme.colors.primary} />
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
			<Pressable
				onPress={() => onOpenRename(device)}
				accessibilityRole="button"
				accessibilityLabel={`Renommer l'appareil ${device.deviceName}`}
				hitSlop={8}
				style={styles.renameButton}
			>
				<PixelIcon icon={PencilSolid} size={20} color={theme.colors.textSecondary} />
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		deviceHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		iconWrapper: {
			width: 36,
			height: 36,
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.md,
			backgroundColor: `${theme.colors.primary}18`,
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
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginRight: theme.spacing.sm,
		},
		renameButton: {
			padding: theme.spacing.xs,
		},
		badge: {
			backgroundColor: theme.colors.primary + '25',
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: 2,
		},
		badgeText: {
			fontSize: 12,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
		deviceMeta: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});
}

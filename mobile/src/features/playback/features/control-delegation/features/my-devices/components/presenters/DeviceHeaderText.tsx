import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';
import { deviceMeta } from '@/features/playback/features/control-delegation/features/my-devices/lib/deviceFormatters';

type DeviceHeaderTextProps = {
	device: UserDeviceWithLicenses;
	isCurrent: boolean;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		textContainer: { flex: 1, marginRight: theme.spacing.sm },
		titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
		deviceName: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginRight: theme.spacing.sm,
		},
		deviceMeta: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}

function createBadgeStyles(theme: Theme) {
	const badgeStyles = StyleSheet.create({
		badge: {
			backgroundColor: theme.colors.primaryTintStrong,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xxs,
		},
		badgeText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
	});
	return badgeStyles;
}

export function DeviceHeaderText({ device, isCurrent }: DeviceHeaderTextProps) {
	const { styles } = useThemedStyles(createStyles);
	const badgeStyles = useThemedStyles(createBadgeStyles).styles;

	return (
		<View style={styles.textContainer}>
			<View style={styles.titleRow}>
				<Text style={styles.deviceName}>{device.deviceName}</Text>
				{isCurrent && (
					<View style={badgeStyles.badge}>
						<Text style={badgeStyles.badgeText}>Cet appareil</Text>
					</View>
				)}
			</View>
			<Text style={styles.deviceMeta}>{deviceMeta(device)}</Text>
		</View>
	);
}

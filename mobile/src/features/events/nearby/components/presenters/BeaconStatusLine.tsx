import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { BeaconScanStatus } from '@/features/events/nearby/hooks/useBeaconScan';

interface BeaconStatusLineProps {
	status: BeaconScanStatus;
	onRequestPermission: () => void;
}

const TEXTS: Partial<Record<BeaconScanStatus, string>> = {
	scanning: 'Détection des balises Bluetooth active',
	off: 'Bluetooth désactivé : détection par la position seulement',
};

export function BeaconStatusLine({ status, onRequestPermission }: BeaconStatusLineProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (status === 'needs-permission') {
		return (
			<Pressable
				style={styles.row}
				onPress={onRequestPermission}
				accessibilityLabel="Détecter aussi les balises Bluetooth"
			>
				<Ionicons name="bluetooth" size={16} color={theme.colors.primary} />
				<Text style={styles.link}>Détecter aussi les balises Bluetooth</Text>
			</Pressable>
		);
	}

	const text = TEXTS[status];
	if (!text) return null;
	return (
		<View style={styles.row}>
			<Ionicons
				name={status === 'scanning' ? 'radio' : 'bluetooth'}
				size={16}
				color={theme.colors.textSecondary}
			/>
			<Text style={styles.text}>{text}</Text>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.xs,
		},
		text: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		link: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.primary,
		},
	});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedSwitch } from '@/shared/components/ui/ThemedSwitch';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { BeaconBroadcast } from '@/features/events/detail/hooks/useBeaconBroadcast';

function description(beacon: BeaconBroadcast): string {
	if (!beacon.available) return "Disponible pendant l'événement";
	if (beacon.starting) return 'Démarrage…';
	if (beacon.active) return 'Les téléphones proches voient votre événement, même sans GPS';
	return 'Annoncez votre événement en Bluetooth aux téléphones proches';
}

export function BeaconCard({ beacon }: { beacon: BeaconBroadcast }) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.card}>
			<Ionicons
				name={beacon.active ? 'radio' : 'radio-outline'}
				size={24}
				color={beacon.active ? theme.colors.primary : theme.colors.textSecondary}
			/>
			<View style={styles.info}>
				<Text style={styles.label}>Diffuser la balise</Text>
				<Text style={styles.description}>{description(beacon)}</Text>
			</View>
			<ThemedSwitch
				value={beacon.active || beacon.starting}
				onValueChange={beacon.toggle}
				disabled={!beacon.available || beacon.starting}
				accessibilityLabel="Diffuser la balise"
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		card: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
			padding: theme.spacing.md,
			borderRadius: 12,
			backgroundColor: theme.colors.surface,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		info: { flex: 1 },
		label: {
			fontSize: theme.typography.sizes.lg,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
	});

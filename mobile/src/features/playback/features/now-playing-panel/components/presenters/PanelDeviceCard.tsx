import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PanelCard } from '@/features/playback/features/now-playing-panel/components/presenters/PanelCard';
import { PanelDeviceIcon } from '@/features/playback/features/now-playing-panel/components/presenters/PanelDeviceIcon';

type PanelDeviceCardProps = {
	deviceLabel: string;
	isRemote: boolean;
	onOpenDevices: () => void;
};

export function PanelDeviceCard({ deviceLabel, isRemote, onOpenDevices }: PanelDeviceCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const link = {
		label: 'Changer',
		accessibilityLabel: "Choisir l'appareil",
		onPress: onOpenDevices,
	};

	return (
		<PanelCard title="Appareil" link={link}>
			<View style={styles.device}>
				<PanelDeviceIcon isRemote={isRemote} />
				<View style={styles.deviceText}>
					<Text style={styles.caption}>Lecture sur</Text>
					<Text style={[styles.deviceName, isRemote && styles.remoteName]} numberOfLines={1}>
						{deviceLabel}
					</Text>
				</View>
			</View>
		</PanelCard>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		device: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
		deviceText: { flex: 1, minWidth: 0 },
		caption: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
		deviceName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		remoteName: { color: theme.colors.primary },
	});
	return styles;
}

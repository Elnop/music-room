import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { ThemedSwitch } from '@/shared/theme/components/ThemedSwitch';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createBeaconCardStyles } from '@/features/events/features/detail/components/presenters/createBeaconCardStyles';
import type { BeaconBroadcast } from '@/features/events/features/detail/eventDetailTypes';
import { Text } from '@/shared/theme/components/Text';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

function description(beacon: BeaconBroadcast): string {
	if (!beacon.available) return "Disponible pendant l'événement";
	if (beacon.starting) return 'Démarrage…';
	if (beacon.active) return 'Les téléphones proches voient votre événement, même sans GPS';
	return 'Annoncez votre événement en Bluetooth aux téléphones proches';
}

type BeaconCardProps = {
	beacon: BeaconBroadcast;
};

export function BeaconCard({ beacon }: BeaconCardProps) {
	const { styles, theme } = useThemedStyles(createBeaconCardStyles);

	return (
		<View style={styles.card}>
			<PixelIcon
				icon={beacon.active ? WifiSolid : WifiSolid}
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

import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { createBeaconCardStyles } from './beaconCardStyles';
import { Text } from '@/shared/components/ui/Text';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

/** Shown instead of the card in a browser, which cannot broadcast over Bluetooth. */
export function BeaconUnavailableCard() {
	const { styles, theme } = useThemedStyles(createBeaconCardStyles);

	return (
		<View style={styles.card}>
			<PixelIcon icon={WifiSolid} size={24} color={theme.colors.textSecondary} />
			<View style={styles.info}>
				<Text style={styles.label}>Diffuser la balise</Text>
				<Text style={styles.description}>
					Disponible depuis l'app Android : un navigateur ne peut pas émettre de balise Bluetooth
				</Text>
			</View>
		</View>
	);
}

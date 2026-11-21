import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { createBeaconLineStyles } from '@/features/events/features/nearby/components/presenters/createBeaconLineStyles';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { BeaconScanStatus } from '@/features/events/features/nearby/nearbyTypes';
import { BeaconPermissionLink } from '@/features/events/features/nearby/components/presenters/BeaconPermissionLink';
import { Text } from '@/shared/theme/components/Text';
import WifiOutline from '@hackernoon/pixel-icon-library/icons/SVG/regular/wifi.svg';
import WifiSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/wifi-solid.svg';

type BeaconStatusLineProps = {
	status: BeaconScanStatus;
	onRequestPermission: () => void;
};

const TEXTS: Partial<Record<BeaconScanStatus, string>> = {
	scanning: 'Détection des balises Bluetooth active',
	off: 'Bluetooth désactivé : détection par la position seulement',
};

export function BeaconStatusLine({ status, onRequestPermission }: BeaconStatusLineProps) {
	const { styles, theme } = useThemedStyles(createBeaconLineStyles);

	if (status === 'needs-permission') return <BeaconPermissionLink onPress={onRequestPermission} />;
	const text = TEXTS[status];
	if (!text) return null;
	return (
		<View style={styles.row}>
			<PixelIcon
				icon={status === 'scanning' ? WifiSolid : WifiOutline}
				size={16}
				color={theme.colors.textSecondary}
			/>
			<Text style={styles.text}>{text}</Text>
		</View>
	);
}

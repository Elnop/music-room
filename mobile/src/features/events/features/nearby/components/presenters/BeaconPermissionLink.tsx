import React from 'react';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { createBeaconLineStyles } from '@/features/events/features/nearby/components/presenters/createBeaconLineStyles';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import WifiOutline from '@hackernoon/pixel-icon-library/icons/SVG/regular/wifi.svg';

type BeaconPermissionLinkProps = {
	onPress: () => void;
};

export function BeaconPermissionLink({ onPress }: BeaconPermissionLinkProps) {
	const { styles, theme } = useThemedStyles(createBeaconLineStyles);

	return (
		<Pressable
			style={styles.row}
			onPress={onPress}
			accessibilityLabel="Détecter aussi les balises Bluetooth"
		>
			<PixelIcon icon={WifiOutline} size={16} color={theme.colors.primary} />
			<Text style={styles.link}>Détecter aussi les balises Bluetooth</Text>
		</Pressable>
	);
}

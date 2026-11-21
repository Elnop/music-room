import React from 'react';
import { StyleSheet } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

type PlayerDeviceKeyProps = {
	deviceLabel: string | null;
	onOpenDevices: () => void;
};

export function PlayerDeviceKey({ deviceLabel, onOpenDevices }: PlayerDeviceKeyProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<KeyButton
			icon={PhoneRingingLowSolid}
			onPress={onOpenDevices}
			accessibilityLabel="Choisir l'appareil"
			appearance={{ tone: 'device', size: 54, style: styles.deviceKey }}
		>
			<Text
				style={styles.deviceText}
				numberOfLines={1}
				accessibilityLabel={deviceLabel ? `Lecture sur ${deviceLabel}` : undefined}
			>
				{deviceLabel ? `Sur ${deviceLabel}` : 'Ce téléphone'}
			</Text>
		</KeyButton>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deviceKey: { flex: 1, justifyContent: 'flex-start' },
		deviceText: {
			flexShrink: 1,
			fontSize: theme.typography.sizes.mdl,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.info,
		},
	});
	return styles;
}

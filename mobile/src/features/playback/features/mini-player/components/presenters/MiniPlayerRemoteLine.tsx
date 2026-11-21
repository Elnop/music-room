import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EqualizerBars } from '@/shared/theme/components/EqualizerBars';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';

type MiniPlayerRemoteLineProps = {
	deviceLabel: string;
	isPlaying: boolean;
};

export function MiniPlayerRemoteLine({ deviceLabel, isPlaying }: MiniPlayerRemoteLineProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.deviceRow}>
			<PixelIcon icon={PhoneRingingLowSolid} size={12} color={theme.colors.info} />
			<Text style={styles.device} numberOfLines={1}>
				Sur {deviceLabel}
			</Text>
			<EqualizerBars color={theme.colors.info} bars={3} height={12} playing={isPlaying} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deviceRow: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			marginTop: theme.spacing.xxs,
		},
		device: {
			fontSize: theme.typography.sizes.xsm,
			fontFamily: theme.typography.families.mono,
			color: theme.colors.info,
		},
	});
	return styles;
}

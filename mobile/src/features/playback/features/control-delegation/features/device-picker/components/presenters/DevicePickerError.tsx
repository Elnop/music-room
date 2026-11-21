import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { keycap } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { DevicePickerCentered } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerCentered';

type DevicePickerErrorProps = {
	onRetry: () => void;
};

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		errorText: {
			fontSize: theme.typography.sizes.mlg,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
		retryButton: {
			...keycap(theme),
			paddingHorizontal: theme.spacing.mdl,
			paddingVertical: theme.spacing.sml,
			backgroundColor: theme.colors.primary,
		},
		retryText: {
			color: theme.colors.textInverse,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}

export function DevicePickerError({ onRetry }: DevicePickerErrorProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<DevicePickerCentered>
			<Text style={styles.errorText}>Impossible de charger les appareils</Text>
			<Pressable
				style={styles.retryButton}
				onPress={onRetry}
				hitSlop={4}
				accessibilityRole="button"
				accessibilityLabel="Réessayer"
			>
				<Text style={styles.retryText}>Réessayer</Text>
			</Pressable>
		</DevicePickerCentered>
	);
}

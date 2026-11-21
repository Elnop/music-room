import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import type { PixelIconSource } from '@/shared/theme/types/pixelIconTypes';
import { pixelCaption } from '@/shared/theme/lib/pixelCaption';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';

type InfoRowProps = {
	icon: PixelIconSource;
	label: string;
	text: string;
};

export function InfoRow({ icon, label, text }: InfoRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.row} accessible accessibilityLabel={`${label} : ${text}`}>
			<PixelIcon icon={icon} size={20} color={theme.colors.primary} style={styles.icon} />
			<View style={styles.body}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.text}>{text}</Text>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
		icon: { marginTop: theme.spacing.xxs },
		body: { flex: 1 },
		label: pixelCaption(theme),
		text: {
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.text,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}

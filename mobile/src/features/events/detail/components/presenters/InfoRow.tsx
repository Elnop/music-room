import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import type { PixelSpriteName } from '@/shared/constants/pixelSprites';
import { pixelCaption } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Text } from '@/shared/components/ui/Text';

interface InfoRowProps {
	icon: PixelSpriteName;
	label: string;
	text: string;
}

export function InfoRow({ icon, label, text }: InfoRowProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.row} accessible accessibilityLabel={`${label} : ${text}`}>
			<PixelIcon name={icon} size={20} color={theme.colors.primary} style={styles.icon} />
			<View style={styles.body}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.text}>{text}</Text>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		row: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md },
		icon: { marginTop: 2 },
		body: { flex: 1 },
		label: pixelCaption(theme),
		text: { fontSize: theme.typography.sizes.lg, color: theme.colors.text, marginTop: 2 },
	});

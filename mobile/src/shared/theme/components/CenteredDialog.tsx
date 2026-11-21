import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { DIALOG_MAX_WIDTH } from '@/shared/theme/lib/layout';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/lib/types';

interface CenteredDialogProps {
	onClose: () => void;
	fill?: boolean;
	children: React.ReactNode;
}

export function CenteredDialog({ onClose, fill = false, children }: CenteredDialogProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.backdrop}>
			<Pressable
				style={StyleSheet.absoluteFill}
				onPress={onClose}
				accessibilityRole="none"
				accessibilityLabel="Fermer"
			/>
			<View style={[styles.dialog, fill ? styles.fill : styles.fit]}>{children}</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		backdrop: {
			flex: 1,
			alignItems: 'center',
			justifyContent: 'center',
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.backdrop,
		},
		dialog: {
			width: '100%',
			maxWidth: DIALOG_MAX_WIDTH,
			overflow: 'hidden',
			...pixelFrame(theme),
			backgroundColor: theme.colors.background,
			...theme.shadows.large,
		},
		fill: { height: '80%' },
		fit: { maxHeight: '85%' },
	});
}

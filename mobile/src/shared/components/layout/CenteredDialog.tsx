import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { DIALOG_MAX_WIDTH } from '@/shared/constants/layout';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { pixelFrame } from '@/shared/theme/pixelFrame';
import type { Theme } from '@/shared/theme/types';

interface CenteredDialogProps {
	onClose: () => void;
	/** For a full-screen sheet on the phone: its content stretches, so the dialog needs a height. */
	fill?: boolean;
	children: React.ReactNode;
}

/** A sheet of the phone, shown on wide screens as a dialog centred over a backdrop that closes it. */
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

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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

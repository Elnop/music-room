import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import type { AlertButton } from 'react-native';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import { dialogStyles } from '@/features/shell/lib/dialogStyles';
import { AlertButtons } from '@/features/shell/components/presenters/AlertButtons';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type AlertDialogProps = {
	title: string;
	message: string;
	buttons: AlertButton[];
	onChoose: (button: AlertButton) => void;
	onCancel: () => void;
};

export function AlertDialog({ title, message, buttons, onChoose, onCancel }: AlertDialogProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Modal visible transparent animationType="fade" onRequestClose={onCancel}>
			<CenteredDialog onClose={onCancel}>
				<View style={styles.body} accessibilityRole="alert">
					<Text style={styles.title}>{title}</Text>
					{message !== '' && <Text style={styles.message}>{message}</Text>}
					<AlertButtons buttons={buttons} onChoose={onChoose} />
				</View>
			</CenteredDialog>
		</Modal>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		...dialogStyles(theme),
		message: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

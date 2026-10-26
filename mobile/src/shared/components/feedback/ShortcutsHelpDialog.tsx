import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { CenteredDialog } from '@/shared/components/layout/CenteredDialog';
import { dialogStyles } from '@/shared/components/layout/dialogStyles';
import { Button } from '@/shared/components/ui/Button';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Theme } from '@/shared/theme/types';
import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';

interface ShortcutsHelpDialogProps {
	visible: boolean;
	shortcuts: readonly Pick<KeyboardShortcut, 'keys' | 'description'>[];
	onClose: () => void;
}

export function ShortcutsHelpDialog({ visible, shortcuts, onClose }: ShortcutsHelpDialogProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<CenteredDialog onClose={onClose}>
				<View style={styles.body}>
					<Text style={styles.title} accessibilityRole="header">
						Raccourcis clavier
					</Text>
					<View style={styles.list}>
						{shortcuts.map(shortcut => (
							<View key={shortcut.keys} style={styles.row}>
								<Text style={styles.description}>{shortcut.description}</Text>
								<Text style={styles.keys}>{shortcut.keys}</Text>
							</View>
						))}
					</View>
					<Text style={styles.hint}>Inactifs pendant la saisie dans un champ.</Text>
					<View style={styles.buttons}>
						<Button title="Fermer" variant="secondary" onPress={onClose} />
					</View>
				</View>
			</CenteredDialog>
		</Modal>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		...dialogStyles(theme),
		list: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
		},
		description: {
			flex: 1,
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
		},
		keys: {
			minWidth: 32,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xs,
			borderRadius: 6,
			borderWidth: 1,
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.surfaceAlt,
			textAlign: 'center',
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		hint: {
			marginTop: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		buttons: {
			flexDirection: 'row',
			justifyContent: 'flex-end',
			marginTop: theme.spacing.lg,
		},
	});

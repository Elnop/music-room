import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { CenteredDialog } from '@/shared/theme/components/CenteredDialog';
import { dialogStyles } from '@/features/shell/lib/dialogStyles';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';
import { Text } from '@/shared/theme/components/Text';
import { ShortcutRow } from '@/features/shell/components/presenters/ShortcutRow';

type ShortcutsHelpDialogProps = {
	visible: boolean;
	shortcuts: readonly Pick<KeyboardShortcut, 'keys' | 'description'>[];
	onClose: () => void;
};

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
							<ShortcutRow key={shortcut.keys} shortcut={shortcut} />
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

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		...dialogStyles(theme),
		list: { marginTop: theme.spacing.md, gap: theme.spacing.sm },
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
	return styles;
}

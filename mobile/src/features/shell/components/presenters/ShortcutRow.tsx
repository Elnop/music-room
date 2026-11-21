import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';
import { Text } from '@/shared/theme/components/Text';
import { ShortcutKeyCap } from '@/features/shell/components/presenters/ShortcutKeyCap';

type ShortcutRowProps = {
	shortcut: Pick<KeyboardShortcut, 'keys' | 'description'>;
};

export function ShortcutRow({ shortcut }: ShortcutRowProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.row}>
			<Text style={styles.description}>{shortcut.description}</Text>
			<ShortcutKeyCap keys={shortcut.keys} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		description: {
			flex: 1,
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
		},
	});
	return styles;
}

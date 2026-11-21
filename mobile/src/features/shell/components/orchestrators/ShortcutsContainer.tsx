import React, { useState } from 'react';
import { useKeyboardShortcuts } from '@/features/shell/hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';
import { ShortcutsHelpDialog } from '@/features/shell/components/presenters/ShortcutsHelpDialog';

export function ShortcutsContainer({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
	const [helpVisible, setHelpVisible] = useState(false);
	const all: KeyboardShortcut[] = [
		...shortcuts,
		{
			key: '?',
			keys: '?',
			description: 'Afficher les raccourcis',
			run: () => setHelpVisible(true),
		},
	];
	useKeyboardShortcuts(all);

	return (
		<ShortcutsHelpDialog
			visible={helpVisible}
			shortcuts={all}
			onClose={() => setHelpVisible(false)}
		/>
	);
}

import React, { useState } from 'react';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { usePlayerShortcuts } from '@/features/player/hooks/usePlayerShortcuts';
import { useSearchFocusStore } from '@/features/search/stores/searchFocusStore';
import { ShortcutsHelpDialog } from '@/shared/components/feedback/ShortcutsHelpDialog';
import { useKeyboardShortcuts } from '@/shared/hooks/useKeyboardShortcuts';
import type { KeyboardShortcut } from '@/shared/utils/keyboardShortcuts';

/** The browser's keyboard shortcuts and their help; a leaf, since the player's shortcuts re-render with the position. */
export function KeyboardShortcuts() {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const requestSearchFocus = useSearchFocusStore(state => state.request);
	const [helpVisible, setHelpVisible] = useState(false);

	const shortcuts: KeyboardShortcut[] = [
		...usePlayerShortcuts(),
		{
			key: '/',
			keys: '/',
			description: 'Rechercher',
			run: () => {
				requestSearchFocus();
				navigation.navigate('SearchTab');
			},
		},
		{
			key: '?',
			keys: '?',
			description: 'Afficher les raccourcis',
			run: () => setHelpVisible(true),
		},
	];
	useKeyboardShortcuts(shortcuts);

	return (
		<ShortcutsHelpDialog
			visible={helpVisible}
			shortcuts={shortcuts}
			onClose={() => setHelpVisible(false)}
		/>
	);
}

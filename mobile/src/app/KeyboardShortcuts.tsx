import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { usePlayerShortcuts } from '@/features/playback/hooks/usePlayerShortcuts';
import { useSearchFocusStore } from '@/features/search/searchFocusStore';
import { ShortcutsContainer } from '@/features/shell/components/orchestrators/ShortcutsContainer';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';

export function KeyboardShortcuts() {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const requestSearchFocus = useSearchFocusStore(state => state.request);
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
	];
	return <ShortcutsContainer shortcuts={shortcuts} />;
}

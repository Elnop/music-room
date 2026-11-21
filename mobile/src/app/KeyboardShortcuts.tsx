import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { usePlayerShortcuts } from '@/features/playback/hooks/usePlayerShortcuts';
import { searchFocusActions } from '@/features/search/searchFocusStore';
import { ShortcutsContainer } from '@/features/shell/components/orchestrators/ShortcutsContainer';
import type { KeyboardShortcut } from '@/shared/keyboard-shortcuts/keyboardShortcutTypes';

export function KeyboardShortcuts() {
	const navigation = useNavigation<NavigationProp<ParamListBase>>();
	const shortcuts: KeyboardShortcut[] = [
		...usePlayerShortcuts(),
		{
			key: '/',
			keys: '/',
			description: 'Rechercher',
			run: () => {
				searchFocusActions.request();
				navigation.navigate('SearchTab');
			},
		},
	];
	return <ShortcutsContainer shortcuts={shortcuts} />;
}

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { isDarkBackground } from '@/features/shell/lib/textContrast';
import { useFocusRing } from '@/features/shell/hooks/useFocusRing';

/** So no white window shows between screens or before the first render. */
export function ThemedSystemUI() {
	const { theme } = useTheme();
	const background = theme.colors.background;
	useFocusRing(theme.colors.primary);

	useEffect(() => {
		SystemUI.setBackgroundColorAsync(background).catch(() => {});
	}, [background]);

	return <StatusBar style={isDarkBackground(background) ? 'light' : 'dark'} />;
}

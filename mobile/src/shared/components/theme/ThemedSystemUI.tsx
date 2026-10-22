import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useTheme } from '@/shared/theme/ThemeContext';
import { isDarkBackground } from '@/shared/components/feedback/ConnectionBanner';

/**
 * Status bar icons and native window background that follow the active theme:
 * dark icons on the light themes, light ones on the dark theme, and no white
 * window showing between screens or before the first render.
 */
export function ThemedSystemUI() {
	const { theme } = useTheme();
	const background = theme.colors.background;

	useEffect(() => {
		SystemUI.setBackgroundColorAsync(background).catch(() => {});
	}, [background]);

	return <StatusBar style={isDarkBackground(background) ? 'light' : 'dark'} />;
}

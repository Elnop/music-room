import React from 'react';
import Toast, { type ToastConfig, type ToastConfigParams } from 'react-native-toast-message';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { ThemedToast, type ToastKind } from './ThemedToast';

function buildConfig(theme: Theme): ToastConfig {
	const render = (kind: ToastKind) => (params: ToastConfigParams<unknown>) => (
		<ThemedToast kind={kind} params={params} theme={theme} />
	);
	return {
		success: render('success'),
		error: render('error'),
		info: render('info'),
		warning: render('warning'),
	};
}

/**
 * The app's toast host (#318), themed from `useTheme()`. Mount it inside
 * `ThemeProvider`; native modals mount their own since the root one sits
 * behind them. Toasts are shown through `utils/toast.ts`.
 */
export function AppToast() {
	const { theme } = useTheme();
	const config = React.useMemo(() => buildConfig(theme), [theme]);
	return <Toast config={config} />;
}

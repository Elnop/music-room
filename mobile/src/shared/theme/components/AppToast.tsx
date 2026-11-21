import React from 'react';
import Toast from 'react-native-toast-message';
import type { ToastConfig, ToastConfigParams } from 'react-native-toast-message';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { ThemedToast } from '@/shared/theme/components/ThemedToast';
import type { ToastKind } from '@/shared/theme/types/toastTypes';

function buildConfig(theme: Theme): ToastConfig {
	function render(kind: ToastKind) {
		return (params: ToastConfigParams<unknown>) => (
			<ThemedToast kind={kind} params={params} theme={theme} />
		);
	}
	return {
		success: render('success'),
		error: render('error'),
		info: render('info'),
		warning: render('warning'),
	};
}

export function AppToast() {
	const { theme } = useTheme();
	const config = React.useMemo(() => buildConfig(theme), [theme]);
	return <Toast config={config} />;
}

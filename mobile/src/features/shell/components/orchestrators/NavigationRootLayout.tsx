import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import type {
	LinkingOptions,
	NavigationContainerRefWithCurrent,
	ParamListBase,
} from '@react-navigation/native';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { NAVIGATION_FONTS } from '@/features/shell/lib/navigationFonts';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { isDarkBackground } from '@/features/shell/lib/textContrast';
import { formatDocumentTitle } from '@/features/shell/lib/documentTitle';

const DOCUMENT_TITLE = { formatter: formatDocumentTitle };

interface NavigationRootLayoutProps<T extends ParamListBase> {
	ready: boolean;
	linking: LinkingOptions<T>;
	navigationRef: NavigationContainerRefWithCurrent<T>;
	children: ReactNode;
}

export function NavigationRootLayout<T extends ParamListBase>({
	ready,
	linking,
	navigationRef,
	children,
}: NavigationRootLayoutProps<T>) {
	const { theme } = useTheme();
	const navigationTheme = useMemo(() => {
		const base = isDarkBackground(theme.colors.background) ? DarkTheme : DefaultTheme;
		return {
			...base,
			fonts: NAVIGATION_FONTS,
			colors: {
				...base.colors,
				primary: theme.colors.primary,
				background: theme.colors.background,
				card: theme.colors.background,
				text: theme.colors.text,
				border: theme.colors.borderLight,
				notification: theme.colors.primary,
			},
		};
	}, [theme]);

	if (!ready) {
		return <LoadingSpinner fullScreen message="Chargement…" />;
	}

	return (
		<NavigationContainer
			ref={navigationRef}
			linking={linking}
			theme={navigationTheme}
			documentTitle={DOCUMENT_TITLE}
		>
			{children}
		</NavigationContainer>
	);
}

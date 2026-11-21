import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import type {
	LinkingOptions,
	NavigationContainerRefWithCurrent,
	ParamListBase,
} from '@react-navigation/native';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { navigationThemeFor } from '@/features/shell/lib/navigationThemeFor';
import { formatDocumentTitle } from '@/features/shell/lib/formatDocumentTitle';

const DOCUMENT_TITLE = { formatter: formatDocumentTitle };

type NavigationRootLayoutProps<T extends ParamListBase> = {
	ready: boolean;
	linking: LinkingOptions<T>;
	navigationRef: NavigationContainerRefWithCurrent<T>;
	children: ReactNode;
};

export function NavigationRootLayout<T extends ParamListBase>({
	ready,
	linking,
	navigationRef,
	children,
}: NavigationRootLayoutProps<T>) {
	const { theme } = useTheme();
	const navigationTheme = useMemo(() => navigationThemeFor(theme), [theme]);

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

import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useConnectionStatus } from '@/features/shell/hooks/useConnectionStatus';
import { useSocketStore } from '@/shared/backend/socketStore';
import type { Theme } from '@/shared/theme/lib/types';
import { ConnectionBanner } from '@/features/shell/components/presenters/ConnectionBanner';

interface AppFrameLayoutProps {
	children: ReactNode;
	panel: ReactNode;
	playerBar: ReactNode;
	miniPlayer: ReactNode;
	overlays: ReactNode;
}

export function AppFrameLayout({
	children,
	panel,
	playerBar,
	miniPlayer,
	overlays,
}: AppFrameLayoutProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { breakpoint } = useBreakpoint();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, insets.bottom), [theme, insets.bottom]);
	const connectionStatus = useConnectionStatus();
	const retryConnection = useSocketStore(state => state.retry);
	const navigatorInsets = React.useMemo(
		() => (connectionStatus ? { ...insets, top: 0 } : insets),
		[connectionStatus, insets]
	);

	return (
		<View style={styles.container}>
			<ConnectionBanner status={connectionStatus} topInset={insets.top} onRetry={retryConnection} />
			<View style={styles.body}>
				<SafeAreaInsetsContext.Provider value={navigatorInsets}>
					{children}
				</SafeAreaInsetsContext.Provider>
				{breakpoint === 'desktop' && panel}
			</View>
			{breakpoint !== 'phone' && (
				<View style={[styles.playerBar, { borderTopColor: separator }]}>
					{breakpoint === 'desktop' ? playerBar : miniPlayer}
				</View>
			)}
			{overlays}
		</View>
	);
}

function createStyles(theme: Theme, bottomInset: number) {
	return StyleSheet.create({
		container: { flex: 1 },
		body: { flex: 1, flexDirection: 'row' },
		playerBar: {
			paddingBottom: bottomInset,
			borderTopWidth: 1,
			backgroundColor: theme.colors.background,
		},
	});
}

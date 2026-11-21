import React from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useConnectionStatus } from '@/features/shell/hooks/useConnectionStatus';
import { useSocketState } from '@/shared/backend/hooks/useSocketState';
import { ConnectionBanner } from '@/features/shell/components/presenters/ConnectionBanner';
import { NavigatorFrame } from '@/features/shell/components/presenters/NavigatorFrame';
import { FramePlayerBar } from '@/features/shell/components/presenters/FramePlayerBar';
import type { FrameSlots } from '@/features/shell/types/frameTypes';

type AppFrameLayoutProps = {
	children: ReactNode;
	panelOpen: boolean;
	slots: FrameSlots;
};

export function AppFrameLayout({ children, panelOpen, slots }: AppFrameLayoutProps) {
	const insets = useSafeAreaInsets();
	const { breakpoint } = useBreakpoint();
	const connectionStatus = useConnectionStatus();
	const retryConnection = useSocketState(state => state.retry);

	return (
		<View style={styles.container}>
			<ConnectionBanner status={connectionStatus} topInset={insets.top} onRetry={retryConnection} />
			<View style={styles.body}>
				<NavigatorFrame
					insets={insets}
					underBanner={Boolean(connectionStatus)}
					panelOpen={panelOpen}
				>
					{children}
				</NavigatorFrame>
				{breakpoint === 'desktop' && slots.panel}
			</View>
			<FramePlayerBar breakpoint={breakpoint} bottomInset={insets.bottom} bars={slots} />
			{slots.overlays}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	body: { flex: 1, flexDirection: 'row' },
});

import React, { useMemo } from 'react';
import type { ReactNode } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import type { EdgeInsets } from 'react-native-safe-area-context';
import { PanelOpenContext } from '@/features/shell/configs/panelOpenContextConfig';

type NavigatorFrameProps = {
	insets: EdgeInsets;
	underBanner: boolean;
	panelOpen: boolean;
	children: ReactNode;
};

export function NavigatorFrame({ insets, underBanner, panelOpen, children }: NavigatorFrameProps) {
	const navigatorInsets = useMemo(
		() => (underBanner ? { ...insets, top: 0 } : insets),
		[underBanner, insets],
	);

	return (
		<SafeAreaInsetsContext.Provider value={navigatorInsets}>
			<PanelOpenContext.Provider value={panelOpen}>{children}</PanelOpenContext.Provider>
		</SafeAreaInsetsContext.Provider>
	);
}

import { useCallback, useState } from 'react';
import { useNowPlayingPanelState } from '@/features/playback/shared/panel/useNowPlayingPanelState';
import { usePanelFocus } from '@/features/playback/features/now-playing-panel/hooks/usePanelFocus';
import type { PanelNavigation } from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

type Sheet = 'queue' | 'devices';

export function usePanelNavigation(): PanelNavigation {
	const setOpen = useNowPlayingPanelState((state) => state.setOpen);
	const [sheet, setSheet] = useState<Sheet | null>(null);
	const close = useCallback(() => setOpen(false), [setOpen]);
	usePanelFocus(close);
	return {
		onClose: close,
		isQueueOpen: sheet === 'queue',
		isDevicesOpen: sheet === 'devices',
		onOpenQueue: () => setSheet('queue'),
		onOpenDevices: () => setSheet('devices'),
		onCloseSheet: () => setSheet(null),
	};
}

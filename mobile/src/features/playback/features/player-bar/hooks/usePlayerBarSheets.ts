import { useState } from 'react';
import type { PlayerBarSheets } from '@/features/playback/features/player-bar/playerBarTypes';

export function usePlayerBarSheets(): PlayerBarSheets {
	const [isQueueOpen, setQueueOpen] = useState(false);
	const [isDevicesOpen, setDevicesOpen] = useState(false);
	return {
		isQueueOpen,
		isDevicesOpen,
		onOpenQueue: () => setQueueOpen(true),
		onCloseQueue: () => setQueueOpen(false),
		onOpenDevices: () => setDevicesOpen(true),
		onCloseDevices: () => setDevicesOpen(false),
	};
}

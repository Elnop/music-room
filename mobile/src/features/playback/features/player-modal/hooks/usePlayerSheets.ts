import { useState } from 'react';
import type { PlayerSheetsState } from '@/features/playback/features/player-modal/playerModalTypes';

const CLOSED = { queue: false, devices: false };

export function usePlayerSheets(isModalOpen: boolean): PlayerSheetsState {
	const [open, setOpen] = useState(CLOSED);
	const [wasModalOpen, setWasModalOpen] = useState(isModalOpen);

	if (wasModalOpen !== isModalOpen) {
		setWasModalOpen(isModalOpen);
		if (!isModalOpen) setOpen(CLOSED);
	}

	return {
		isQueueOpen: open.queue,
		setQueueOpen: queue => setOpen(current => ({ ...current, queue })),
		isDevicesOpen: open.devices,
		setDevicesOpen: devices => setOpen(current => ({ ...current, devices })),
	};
}

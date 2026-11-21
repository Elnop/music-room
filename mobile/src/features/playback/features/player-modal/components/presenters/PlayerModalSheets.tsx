import React from 'react';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import type { PlayerSheetsState } from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerModalSheetsProps = {
	sheets: PlayerSheets;
	state: PlayerSheetsState;
	visible: boolean;
};

export function PlayerModalSheets({ sheets, state, visible }: PlayerModalSheetsProps) {
	const { QueueModal, DevicePicker } = sheets;

	return (
		<>
			<QueueModal
				visible={visible && state.isQueueOpen}
				onClose={() => state.setQueueOpen(false)}
			/>
			<DevicePicker
				visible={visible && state.isDevicesOpen}
				onClose={() => state.setDevicesOpen(false)}
			/>
		</>
	);
}

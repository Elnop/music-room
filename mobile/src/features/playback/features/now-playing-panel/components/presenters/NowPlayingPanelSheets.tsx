import React from 'react';
import type {
	NowPlayingPanelData,
	PanelSheetComponents,
} from '@/features/playback/features/now-playing-panel/nowPlayingPanelTypes';

type NowPlayingPanelSheetsProps = {
	data: NowPlayingPanelData;
	sheets: PanelSheetComponents;
};

export function NowPlayingPanelSheets({ data, sheets }: NowPlayingPanelSheetsProps) {
	const { QueueModal, DevicePicker, TrackActionsSheet } = sheets;

	return (
		<>
			<QueueModal visible={data.isQueueOpen} onClose={data.onCloseSheet} />
			<DevicePicker visible={data.isDevicesOpen} onClose={data.onCloseSheet} />
			<TrackActionsSheet
				track={data.actions?.track ?? null}
				start={data.actions?.start}
				onClose={data.onCloseActions}
			/>
		</>
	);
}

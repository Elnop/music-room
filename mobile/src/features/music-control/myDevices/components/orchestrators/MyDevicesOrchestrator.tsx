import React from 'react';
import { useMyDevicesScreen } from '@/features/music-control/myDevices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/music-control/myDevices/components/presenters/MyDevicesView';
import { RenameDeviceModal } from '@/features/music-control/myDevices/components/orchestrators/RenameDeviceModal';

export function MyDevicesOrchestrator() {
	const screenState = useMyDevicesScreen();
	return (
		<>
			<MyDevicesView {...screenState} />
			<RenameDeviceModal
				deviceName={screenState.renamingDevice?.deviceName ?? null}
				saving={screenState.isRenameSaving}
				onClose={screenState.onCloseRename}
				onSubmit={screenState.onSubmitRename}
			/>
		</>
	);
}

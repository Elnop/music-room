import React from 'react';
import { useMyDevicesScreen } from '@/features/music-control/myDevices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/music-control/myDevices/components/presenters/MyDevicesView';
import { RenameDeviceModalContainer } from '@/features/music-control/myDevices/components/orchestrators/RenameDeviceModalContainer';

export function MyDevicesContainer() {
	const screenState = useMyDevicesScreen();
	return (
		<>
			<MyDevicesView {...screenState} />
			<RenameDeviceModalContainer
				deviceName={screenState.renamingDevice?.deviceName ?? null}
				saving={screenState.isRenameSaving}
				onClose={screenState.onCloseRename}
				onSubmit={screenState.onSubmitRename}
			/>
		</>
	);
}

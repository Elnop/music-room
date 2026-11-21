import React from 'react';
import { useMyDevicesScreen } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesView';
import { RenameDeviceModalContainer } from '@/features/playback/features/control-delegation/features/my-devices/components/orchestrators/RenameDeviceModalContainer';

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

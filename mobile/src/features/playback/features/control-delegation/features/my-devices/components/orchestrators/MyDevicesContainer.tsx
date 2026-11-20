import React from 'react';
import { useMyDevicesScreen } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesView';
import { RenameDeviceModalContainer } from './RenameDeviceModalContainer';

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

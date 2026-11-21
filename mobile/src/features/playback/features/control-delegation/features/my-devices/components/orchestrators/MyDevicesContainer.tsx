import React from 'react';
import { useMyDevicesScreen } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/MyDevicesView';
import { RenameDeviceModalContainer } from '@/features/playback/features/control-delegation/features/my-devices/components/orchestrators/RenameDeviceModalContainer';

export function MyDevicesContainer() {
	const { rename, ...screen } = useMyDevicesScreen();
	return (
		<>
			<MyDevicesView {...screen} />
			<RenameDeviceModalContainer
				deviceName={rename.rename.device?.deviceName ?? null}
				saving={rename.rename.saving}
				onClose={rename.onCloseRename}
				onSubmit={rename.onSubmitRename}
			/>
		</>
	);
}

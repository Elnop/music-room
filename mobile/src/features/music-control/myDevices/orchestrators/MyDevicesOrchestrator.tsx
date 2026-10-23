import React from 'react';
import { useMyDevicesScreen } from '@/features/music-control/myDevices/hooks/useMyDevicesScreen';
import { MyDevicesView } from '@/features/music-control/myDevices/presenters/MyDevicesView';

export function MyDevicesOrchestrator() {
	const screenState = useMyDevicesScreen();
	return <MyDevicesView {...screenState} />;
}

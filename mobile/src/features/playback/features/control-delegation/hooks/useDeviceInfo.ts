import { useEffect, useState } from 'react';
import { deviceService } from '@/shared/backend/deviceService';
import type { DeviceInfo } from '@/shared/backend/types/deviceTypes';

export function useDeviceInfo(): DeviceInfo | null {
	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

	useEffect(() => {
		deviceService.getDeviceInfo().then((info) => {
			setDeviceInfo(info);
		});
	}, []);

	return deviceInfo;
}

import { useCallback, useState } from 'react';
import { saveDeviceName } from '@/features/playback/features/control-delegation/features/my-devices/lib/saveDeviceName';
import type { RenameState } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';
import type { UserDeviceWithLicenses } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export function useRenameDevice(load: (isRefresh: boolean) => Promise<void>) {
	const [rename, setRename] = useState<RenameState>({ device: null, saving: false });

	const onSubmitRename = useCallback(
		async (name: string | null) => {
			if (!rename.device) return;
			setRename(current => ({ ...current, saving: true }));
			if (await saveDeviceName(rename.device.deviceId, name)) {
				setRename(current => ({ ...current, device: null }));
				await load(true);
			}
			setRename(current => ({ ...current, saving: false }));
		},
		[rename.device, load]
	);

	return {
		rename,
		onOpenRename: (device: UserDeviceWithLicenses) =>
			setRename(current => ({ ...current, device })),
		onCloseRename: () => {
			if (!rename.saving) setRename(current => ({ ...current, device: null }));
		},
		onSubmitRename,
	};
}

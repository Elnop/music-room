import { useCallback, useRef, useState } from 'react';
import { transferTo } from '@/features/playback/features/control-delegation/features/device-picker/lib/transferTo';
import type { PickerRow } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

export function usePickTransfer(onClose: () => void) {
	const [pendingKey, setPendingKey] = useState<string | null>(null);
	const pendingRef = useRef(false);

	const onPick = useCallback(
		async (row: PickerRow) => {
			if (pendingRef.current || !row.device.online || row.active) return;
			pendingRef.current = true;
			setPendingKey(row.key);
			try {
				if (await transferTo(row.owner, row.device.deviceId)) onClose();
			} finally {
				pendingRef.current = false;
				setPendingKey(null);
			}
		},
		[onClose]
	);

	return { pendingKey, onPick };
}

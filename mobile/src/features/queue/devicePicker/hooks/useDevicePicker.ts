import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/theme/ThemeContext';
import { getDevicePicker } from '@/shared/services/musicControlBridge';
import { deviceService } from '@/shared/services/deviceService';
import { useConnectStore } from '@/features/queue/stores/connectStore';
import { transferTo } from '@/features/queue/services/transferPlayback';
import { logger } from '@/shared/utils/logger';
import { createPickerStyles } from '@/features/queue/devicePicker/components/presenters/devicePickerStyles';
import type { DevicePickerOwner } from '@/types/device.types';
import type { PickerDevice } from '@/features/queue/devicePicker/components/presenters/DeviceRow';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';

export interface LoadedDevices {
	owners: DevicePickerOwner[];
	phoneId: string;
}

export function useDevicePicker(visible: boolean, onClose: () => void) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const separator = useSeparatorColor();
	const styles = React.useMemo(
		() => createPickerStyles(theme, insets, separator),
		[theme, insets, separator]
	);
	const target = useConnectStore(state => state.target);

	const [loaded, setLoaded] = React.useState<LoadedDevices | null>(null);
	const [loading, setLoading] = React.useState(visible);
	const [loadError, setLoadError] = React.useState(false);
	const [attempt, setAttempt] = React.useState(0);
	const [pendingKey, setPendingKey] = React.useState<string | null>(null);
	const pendingRef = React.useRef(false);

	const [wasVisible, setWasVisible] = React.useState(visible);
	if (wasVisible !== visible) {
		setWasVisible(visible);
		if (visible) {
			setLoaded(null);
			setLoading(true);
			setLoadError(false);
		}
	}

	React.useEffect(() => {
		if (!visible) return;
		let cancelled = false;
		Promise.all([getDevicePicker(), deviceService.getDeviceInfo()])
			.then(([picker, info]) => {
				if (!cancelled) setLoaded({ owners: picker.owners, phoneId: info.deviceId });
			})
			.catch(error => {
				logger.error('[DevicePickerSheet] Loading devices failed:', error);
				if (!cancelled) setLoadError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [visible, attempt]);

	const retry = React.useCallback(() => {
		setLoading(true);
		setLoadError(false);
		setAttempt(count => count + 1);
	}, []);

	const isActive = React.useCallback(
		(owner: DevicePickerOwner, deviceId: string): boolean =>
			target.kind === 'local'
				? owner.isSelf && deviceId === loaded?.phoneId
				: target.ownerId === owner.ownerId && target.deviceId === deviceId,
		[target, loaded]
	);

	const handlePick = React.useCallback(
		async (owner: DevicePickerOwner, device: PickerDevice) => {
			if (pendingRef.current || !device.online || isActive(owner, device.deviceId)) return;
			pendingRef.current = true;
			setPendingKey(`${owner.ownerId}:${device.deviceId}`);
			try {
				if (await transferTo(owner, device.deviceId)) onClose();
			} finally {
				pendingRef.current = false;
				setPendingKey(null);
			}
		},
		[isActive, onClose]
	);

	return {
		theme,
		styles,
		loaded,
		loading,
		loadError,
		pendingKey,
		retry,
		isActive,
		handlePick,
	};
}

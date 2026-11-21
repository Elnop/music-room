import type {
	LoadedDevices,
	PickerDevice,
	PickerRow,
	PickerSections,
	PickerSelection,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';
import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';

type RowContext = PickerSelection & { phoneId: string };

function isActiveDevice(context: RowContext, owner: DevicePickerOwner, deviceId: string): boolean {
	const { target } = context;
	return target.kind === 'local'
		? owner.isSelf && deviceId === context.phoneId
		: target.ownerId === owner.ownerId && target.deviceId === deviceId;
}

function toRow(context: RowContext, owner: DevicePickerOwner, device: PickerDevice): PickerRow {
	const key = `${owner.ownerId}:${device.deviceId}`;
	return {
		key,
		owner,
		device,
		active: isActiveDevice(context, owner, device.deviceId),
		pending: context.pendingKey === key,
		disabled: !device.online || context.pendingKey !== null,
	};
}

export function pickerSections(loaded: LoadedDevices, selection: PickerSelection): PickerSections {
	const context = { ...selection, phoneId: loaded.phoneId };
	const self = loaded.owners.find(owner => owner.isSelf);
	const phone = self?.devices.find(device => device.deviceId === loaded.phoneId);
	const myOthers = self?.devices.filter(device => device.deviceId !== loaded.phoneId) ?? [];
	return {
		phone: self && phone ? toRow(context, self, phone) : null,
		myOthers: self ? myOthers.map(device => toRow(context, self, device)) : [],
		friends: loaded.owners
			.filter(owner => !owner.isSelf)
			.map(owner => ({
				owner,
				rows: owner.devices.map(device => toRow(context, owner, device)),
			})),
	};
}

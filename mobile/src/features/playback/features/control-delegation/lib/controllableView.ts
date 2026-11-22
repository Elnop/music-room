import type {
	ControllableIds,
	ControllableView,
} from '@/features/playback/features/control-delegation/controlDelegationTypes';

const NO_IDS: string[] = [];

export function controllableView(
	controllable: ControllableIds | null,
	targetUserId: string | null,
): ControllableView {
	const current = controllable && controllable.userId === targetUserId ? controllable : null;
	const allDevices = current?.allDevices ?? false;
	const ids = current ? current.ids : NO_IDS;
	return { allDevices, ids, canControl: allDevices || ids.length > 0 };
}

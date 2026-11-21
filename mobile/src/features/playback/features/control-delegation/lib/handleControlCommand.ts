import { getSession } from '@/shared/backend/lib/authSession';
import {
	queueTrackToSoundCloud,
	trackToSoundCloud,
} from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { DeviceCommand } from '@/shared/playback/types/queueTypes';
import type { ControlCommand } from '@/features/playback/features/control-delegation/controlDelegationTypes';

type PlayItemCommand = Extract<DeviceCommand, { action: 'play-item' }>;

function playItem({ item, positionMs, version }: PlayItemCommand): void {
	playerStore.getState().playTrack(trackToSoundCloud(item), item.id, positionMs);
	const me = getSession().user?.id;
	if (me) queueStore.getState().setCurrentItem(me, item.id, version);
	connectStore.getState().setLocal();
}

export function handleControlCommand(data: ControlCommand): void {
	const playback = playerStore.getState();
	switch (data.action) {
		case 'play':
			playback.resume();
			break;
		case 'pause':
			playback.pause();
			break;
		case 'play-item':
			playItem(data);
			break;
		case 'play-track':
			playback.playTrack(queueTrackToSoundCloud(data.track), undefined, data.positionMs);
			connectStore.getState().setLocal();
			break;
	}
}

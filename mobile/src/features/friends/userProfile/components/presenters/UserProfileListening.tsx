import React from 'react';
import { NowPlayingInline } from '@/shared/components/media/NowPlayingInline';
import type { FriendListeningDevice } from '@/features/friends/types';

interface UserProfileListeningProps {
	devices: FriendListeningDevice[];
	onRemotePlay: (deviceId: string) => void;
	onRemotePause: (deviceId: string) => void;
}

export function UserProfileListening({
	devices,
	onRemotePlay,
	onRemotePause,
}: UserProfileListeningProps) {
	return (
		<>
			{devices.map(({ device, track, isPlaying, controllable }) =>
				track ? (
					<NowPlayingInline
						key={device.deviceId}
						track={track}
						isPlaying={isPlaying}
						onPlay={() => onRemotePlay(device.deviceId)}
						onPause={() => onRemotePause(device.deviceId)}
						controllable={controllable}
					/>
				) : null
			)}
		</>
	);
}

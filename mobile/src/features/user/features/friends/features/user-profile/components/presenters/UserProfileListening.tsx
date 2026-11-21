import React from 'react';
import { NowPlayingInline } from '@/features/user/features/friends/features/user-profile/components/presenters/NowPlayingInline';
import type { ProfileListening } from '@/features/user/features/friends/features/user-profile/userProfileTypes';

type UserProfileListeningProps = {
	listening: ProfileListening;
};

export function UserProfileListening({ listening }: UserProfileListeningProps) {
	return (
		<>
			{listening.devices.map(({ device, track, isPlaying, controllable }) =>
				track ? (
					<NowPlayingInline
						key={device.deviceId}
						track={track}
						isPlaying={isPlaying}
						onPlay={() => listening.onRemotePlay(device.deviceId)}
						onPause={() => listening.onRemotePause(device.deviceId)}
						controllable={controllable}
					/>
				) : null
			)}
		</>
	);
}

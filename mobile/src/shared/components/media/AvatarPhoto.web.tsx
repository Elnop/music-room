import React from 'react';
import type { AvatarPhotoProps } from './AvatarPhoto';

/** A plain <img>: Google answers a photo request that carries a Referer with a 429, and react-native-web's Image cannot drop it. */
export function AvatarPhoto({ uri, size, onLoad, onError }: AvatarPhotoProps) {
	return (
		<img
			src={uri}
			alt=""
			referrerPolicy="no-referrer"
			draggable={false}
			onLoad={onLoad}
			onError={onError}
			style={{
				position: 'absolute',
				inset: 0,
				width: size,
				height: size,
				borderRadius: '50%',
				objectFit: 'cover',
			}}
		/>
	);
}

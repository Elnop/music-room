import React from 'react';
import type { AvatarPhotoProps } from './AvatarPhoto';

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
				objectFit: 'cover',
			}}
		/>
	);
}

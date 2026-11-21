import React from 'react';
import type { CSSProperties } from 'react';
import type { AvatarPhotoProps } from '@/shared/theme/types/avatarPhotoTypes';

function imageStyle(size: number): CSSProperties {
	return {
		position: 'absolute',
		inset: 0,
		width: size,
		height: size,
		objectFit: 'cover',
	};
}

export function AvatarPhoto({ uri, size, onLoad, onError }: AvatarPhotoProps) {
	return (
		<img
			src={uri}
			alt=""
			referrerPolicy="no-referrer"
			draggable={false}
			onLoad={onLoad}
			onError={onError}
			style={imageStyle(size)}
		/>
	);
}

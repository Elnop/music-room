import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { squareStyle } from '@/shared/theme/lib/squareStyle';
import type { AvatarPhotoProps } from '@/shared/theme/types/avatarPhotoTypes';

export function AvatarPhoto({ uri, size, onLoad, onError }: AvatarPhotoProps) {
	return (
		<Image
			source={{ uri }}
			onLoad={onLoad}
			onError={onError}
			style={[styles.image, squareStyle(size)]}
		/>
	);
}

const styles = StyleSheet.create({
	image: {
		...StyleSheet.absoluteFillObject,
		resizeMode: 'cover',
	},
});

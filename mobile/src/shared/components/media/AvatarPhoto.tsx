import React from 'react';
import { Image, StyleSheet } from 'react-native';

export interface AvatarPhotoProps {
	uri: string;
	size: number;
	onLoad: () => void;
	onError: () => void;
}

/** The photo laid over the avatar's initials. */
export function AvatarPhoto({ uri, size, onLoad, onError }: AvatarPhotoProps) {
	return (
		<Image
			source={{ uri }}
			onLoad={onLoad}
			onError={onError}
			style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
		/>
	);
}

const styles = StyleSheet.create({
	image: {
		...StyleSheet.absoluteFillObject,
		resizeMode: 'cover',
	},
});

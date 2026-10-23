import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Side of the square JPEG sent as a profile photo (#351). */
export const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.8;

interface PickedImage {
	uri: string;
	width: number;
	height: number;
}

/**
 * The picked image as a 512×512 JPEG, cropped to its centred square first in
 * case the picker's square crop was skipped. Returns the local file's URI.
 */
export async function prepareAvatar({ uri, width, height }: PickedImage): Promise<string> {
	const context = ImageManipulator.manipulate(uri);

	const side = Math.min(width, height);
	if (side > 0 && width !== height) {
		context.crop({
			originX: Math.floor((width - side) / 2),
			originY: Math.floor((height - side) / 2),
			width: side,
			height: side,
		});
	}
	context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });

	const image = await context.renderAsync();
	const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: AVATAR_QUALITY });
	return result.uri;
}

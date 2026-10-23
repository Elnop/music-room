import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Side of the square JPEG sent as a profile photo. */
export const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.8;

interface PickedImage {
	uri: string;
	width: number;
	height: number;
}

/** Cropped to its centred square first, in case the picker's crop was skipped; returns the local URI. */
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

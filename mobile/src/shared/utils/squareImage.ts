import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export const SQUARE_IMAGE_SIZE = 512;
const JPEG_QUALITY = 0.8;

interface PickedImage {
	uri: string;
	width: number;
	height: number;
}

/** Crops to the centred square again, in case the picker's crop was skipped. */
export async function prepareSquareImage({ uri, width, height }: PickedImage): Promise<string> {
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
	context.resize({ width: SQUARE_IMAGE_SIZE, height: SQUARE_IMAGE_SIZE });

	const image = await context.renderAsync();
	const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
	return result.uri;
}

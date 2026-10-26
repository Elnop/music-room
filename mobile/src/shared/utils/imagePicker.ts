import * as ImagePicker from 'expo-image-picker';
import { showError } from '@/shared/utils/toast';

export type ImageSource = 'library' | 'camera';

interface PickedImage {
	uri: string;
	width: number;
	height: number;
}

/** Square crop offered in the picker; `prepareSquareImage` crops again if it was skipped. */
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: ['images'],
	allowsEditing: true,
	aspect: [1, 1],
	quality: 1,
};

/** Asks for the permission, then opens the library or the camera; null when denied or cancelled. */
export async function pickImage(
	source: ImageSource,
	deniedMessage: string
): Promise<PickedImage | null> {
	const { granted } =
		source === 'camera'
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!granted) {
		showError(deniedMessage);
		return null;
	}

	const result =
		source === 'camera'
			? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
			: await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
	const asset = result.assets?.[0];
	return result.canceled || !asset ? null : asset;
}

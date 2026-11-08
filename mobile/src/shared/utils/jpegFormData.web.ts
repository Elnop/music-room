import { readLocalBlob } from '@/shared/services/api';

/** The browser's FormData takes only a Blob. */
export async function jpegFormData(field: string, uri: string, _name: string): Promise<FormData> {
	const image = await readLocalBlob(uri);
	const form = new FormData();
	form.append(field, image);
	return form;
}

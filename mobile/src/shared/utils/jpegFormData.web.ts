import { readLocalBlob } from '@/shared/services/api';

/** Browser variant: FormData takes only a Blob, so the local blob: or data: URI is read into one. */
export async function jpegFormData(field: string, uri: string, _name: string): Promise<FormData> {
	const image = await readLocalBlob(uri);
	const form = new FormData();
	form.append(field, image);
	return form;
}

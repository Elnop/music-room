import { readLocalBlob } from '@/shared/backend/lib/api';

export async function jpegFormData(field: string, uri: string, _name: string): Promise<FormData> {
	const image = await readLocalBlob(uri);
	const form = new FormData();
	form.append(field, image);
	return form;
}

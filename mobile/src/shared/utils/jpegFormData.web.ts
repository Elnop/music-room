/** Browser variant: FormData takes only a Blob, so the local blob: or data: URI is read into one. */
export async function jpegFormData(field: string, uri: string, _name: string): Promise<FormData> {
	const image = await (await fetch(uri)).blob();
	const form = new FormData();
	form.append(field, image);
	return form;
}

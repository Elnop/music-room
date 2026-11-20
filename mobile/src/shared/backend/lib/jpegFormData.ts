/** React Native's FormData uploads a local file described as `{ uri, name, type }`. */
export function jpegFormData(field: string, uri: string, name: string): Promise<FormData> {
	const form = new FormData();
	form.append(field, { uri, name, type: 'image/jpeg' } as unknown as Blob);
	return Promise.resolve(form);
}

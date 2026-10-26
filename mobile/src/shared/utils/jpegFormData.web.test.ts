import { jpegFormData } from './jpegFormData.web';

describe('jpegFormData (web)', () => {
	it('reads the local URI into a Blob, the only file part a browser FormData takes', async () => {
		const image = { size: 3 };
		const fetchMock = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(image) });
		globalThis.fetch = fetchMock;
		const append = jest.spyOn(FormData.prototype, 'append');

		await jpegFormData('avatar', 'blob:http://localhost:8081/1', 'avatar.jpg');

		expect(fetchMock).toHaveBeenCalledWith('blob:http://localhost:8081/1');
		expect(append).toHaveBeenCalledWith('avatar', image);
	});
});

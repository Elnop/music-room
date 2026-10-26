import { readLocalBlob } from '@/shared/services/api';
import { jpegFormData } from './jpegFormData.web';

jest.mock('@/shared/services/api', () => ({ readLocalBlob: jest.fn() }));

describe('jpegFormData (web)', () => {
	it('appends the local image as a Blob, the only file part a browser FormData takes', async () => {
		const image = { size: 3 };
		jest.mocked(readLocalBlob).mockResolvedValue(image as unknown as Blob);
		const append = jest.spyOn(FormData.prototype, 'append');

		await jpegFormData('avatar', 'blob:http://localhost:8081/1', 'avatar.jpg');

		expect(readLocalBlob).toHaveBeenCalledWith('blob:http://localhost:8081/1');
		expect(append).toHaveBeenCalledWith('avatar', image);
	});
});

import { readLocalBlob } from '@/shared/backend/lib/api';
import { jpegFormData } from '@/shared/backend/lib/jpegFormData.web';

jest.mock('@/shared/backend/lib/api', () => ({ readLocalBlob: jest.fn() }));

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

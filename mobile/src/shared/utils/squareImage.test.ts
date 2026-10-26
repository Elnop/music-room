import { prepareSquareImage, SQUARE_IMAGE_SIZE } from './squareImage';

const mockContext = {
	crop: jest.fn(),
	resize: jest.fn(),
	renderAsync: jest.fn(),
};
const mockSaveAsync = jest.fn();
const mockManipulate = jest.fn((_uri: string) => mockContext);

jest.mock('expo-image-manipulator', () => ({
	ImageManipulator: { manipulate: (uri: string) => mockManipulate(uri) },
	SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

beforeEach(() => {
	jest.clearAllMocks();
	mockContext.renderAsync.mockResolvedValue({ saveAsync: mockSaveAsync });
	mockSaveAsync.mockResolvedValue({ uri: 'file:///cache/avatar-512.jpg', width: 512, height: 512 });
});

describe('prepareSquareImage', () => {
	it('resizes a square image to a 512 px JPEG at 0.8', async () => {
		const uri = await prepareSquareImage({ uri: 'file:///picked.png', width: 1200, height: 1200 });

		expect(uri).toBe('file:///cache/avatar-512.jpg');
		expect(mockManipulate).toHaveBeenCalledWith('file:///picked.png');
		expect(mockContext.crop).not.toHaveBeenCalled();
		expect(mockContext.resize).toHaveBeenCalledWith({ width: SQUARE_IMAGE_SIZE, height: SQUARE_IMAGE_SIZE });
		expect(mockSaveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.8 });
	});

	it('crops a non-square image to its centred square first', async () => {
		await prepareSquareImage({ uri: 'file:///wide.jpg', width: 1000, height: 600 });

		expect(mockContext.crop).toHaveBeenCalledWith({
			originX: 200,
			originY: 0,
			width: 600,
			height: 600,
		});
		expect(mockContext.crop.mock.invocationCallOrder[0]).toBeLessThan(
			mockContext.resize.mock.invocationCallOrder[0]
		);
	});
});

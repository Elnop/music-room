import { describe, expect, it } from 'vitest';
import { detectImageType } from '@/shared/storage/image-type.js';

const bytes = (...values: number[]) => Buffer.from(values);

describe('detectImageType (magic bytes, #351)', () => {
	it('recognises JPEG', () => {
		expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10))).toEqual({
			mime: 'image/jpeg',
			ext: 'jpg',
		});
	});

	it('recognises PNG', () => {
		expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toEqual({
			mime: 'image/png',
			ext: 'png',
		});
	});

	it('recognises WebP (RIFF....WEBP)', () => {
		const webp = Buffer.concat([
			Buffer.from('RIFF'),
			bytes(0x24, 0, 0, 0),
			Buffer.from('WEBPVP8 '),
		]);
		expect(detectImageType(webp)).toEqual({ mime: 'image/webp', ext: 'webp' });
	});

	it('rejects a text file whatever its name', () => {
		expect(detectImageType(Buffer.from('hello, I am not a photo'))).toBeNull();
	});

	it('rejects another RIFF file (WAV)', () => {
		const wav = Buffer.concat([Buffer.from('RIFF'), bytes(0x24, 0, 0, 0), Buffer.from('WAVEfmt ')]);
		expect(detectImageType(wav)).toBeNull();
	});

	it('rejects GIF and truncated signatures', () => {
		expect(detectImageType(Buffer.from('GIF89a'))).toBeNull();
		expect(detectImageType(bytes(0xff, 0xd8))).toBeNull();
		expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47))).toBeNull();
		expect(detectImageType(Buffer.alloc(0))).toBeNull();
	});
});

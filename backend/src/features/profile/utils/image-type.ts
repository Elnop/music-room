/** The client's declared MIME type and file name are never trusted: the type comes from the magic bytes. */

interface ImageType {
	mime: 'image/jpeg' | 'image/png' | 'image/webp';
	ext: 'jpg' | 'png' | 'webp';
}

const JPEG: ImageType = { mime: 'image/jpeg', ext: 'jpg' };
const PNG: ImageType = { mime: 'image/png', ext: 'png' };
const WEBP: ImageType = { mime: 'image/webp', ext: 'webp' };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(buffer: Buffer, bytes: number[], offset = 0): boolean {
	if (buffer.length < offset + bytes.length) return false;
	return bytes.every((byte, i) => buffer[offset + i] === byte);
}

export function detectImageType(buffer: Buffer): ImageType | null {
	if (startsWith(buffer, [0xff, 0xd8, 0xff])) return JPEG;
	if (startsWith(buffer, PNG_SIGNATURE)) return PNG;
	// RIFF....WEBP
	if (
		startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) &&
		startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)
	) {
		return WEBP;
	}
	return null;
}

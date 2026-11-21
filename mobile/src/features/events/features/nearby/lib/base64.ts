const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(base64: string): number[] {
	const clean = base64.replaceAll(/[^A-Za-z0-9+/]/gu, '');
	const bytes: number[] = [];
	let buffer = 0;
	let bits = 0;
	for (const char of clean) {
		buffer = (buffer << 6) | ALPHABET.indexOf(char);
		bits += 6;
		if (bits >= 8) {
			bits -= 8;
			bytes.push((buffer >> bits) & 0xff);
		}
	}
	return bytes;
}

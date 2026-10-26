import { base64ToBytes } from './base64';

describe('base64ToBytes', () => {
	it('decodes with and without padding', () => {
		expect(base64ToBytes('TABBFQ==')).toEqual([0x4c, 0x00, 0x41, 0x15]);
		expect(base64ToBytes('AQID')).toEqual([1, 2, 3]);
		expect(base64ToBytes('/+8=')).toEqual([0xff, 0xef]);
	});
});

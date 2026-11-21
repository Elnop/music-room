import { base64ToBytes } from '@/features/events/features/nearby/lib/base64';

describe('base64ToBytes', () => {
	it('decodes with and without padding', () => {
		expect(base64ToBytes('TABBFQ==')).toStrictEqual([0x4c, 0x00, 0x41, 0x15]);
		expect(base64ToBytes('AQID')).toStrictEqual([1, 2, 3]);
		expect(base64ToBytes('/+8=')).toStrictEqual([0xff, 0xef]);
	});
});

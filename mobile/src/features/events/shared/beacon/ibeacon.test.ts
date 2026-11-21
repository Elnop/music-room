import { buildIBeaconPayload, eventBeaconFrame } from '@/features/events/shared/beacon/ibeacon';
import { MEASURED_POWER, ZUMIK_BEACON_UUID } from '@/features/events/shared/beacon/ibeaconConfig';

describe('buildIBeaconPayload', () => {
	it('lays out type, length, UUID, major, minor and measured power', () => {
		const payload = buildIBeaconPayload({
			uuid: '01234567-89ab-cdef-0123-456789abcdef',
			major: 0x0102,
			minor: 0xa0b1,
			measuredPower: -59,
		});
		expect(payload).toStrictEqual([
			0x02, 0x15, 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef, 0x01, 0x23, 0x45, 0x67, 0x89,
			0xab, 0xcd, 0xef, 0x01, 0x02, 0xa0, 0xb1, 0xc5,
		]);
	});

	it("announces an event with Zumik's UUID and the event's minor", () => {
		const payload = buildIBeaconPayload(eventBeaconFrame(42));
		expect(payload).toHaveLength(23);
		expect(
			payload
				.slice(2, 18)
				.map(b => b.toString(16).padStart(2, '0'))
				.join('')
		).toBe(ZUMIK_BEACON_UUID.replaceAll('-', ''));
		expect(payload.slice(20, 22)).toStrictEqual([0, 42]);
		expect(payload[22]).toBe(MEASURED_POWER & 0xff);
	});

	it('refuses a minor out of range and a malformed UUID', () => {
		expect(() => buildIBeaconPayload(eventBeaconFrame(70_000))).toThrow('Invalid minor');
		expect(() => buildIBeaconPayload({ ...eventBeaconFrame(1), uuid: 'nope' })).toThrow(
			'Invalid UUID'
		);
	});
});

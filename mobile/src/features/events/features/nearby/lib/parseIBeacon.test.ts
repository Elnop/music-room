import {
	buildIBeaconPayload,
	eventBeaconFrame,
	zumikBeaconMinor,
} from '@/features/events/shared/beacon/ibeacon';
import { parseIBeacon } from '@/features/events/features/nearby/lib/parseIBeacon';

describe('parseIBeacon', () => {
	function withCompanyId(payload: number[]) {
		return [0x4c, 0x00, ...payload];
	}

	it('reads back a frame built by buildIBeaconPayload', () => {
		const frame = eventBeaconFrame(513);
		expect(parseIBeacon(withCompanyId(buildIBeaconPayload(frame)))).toStrictEqual(frame);
		expect(zumikBeaconMinor(parseIBeacon(withCompanyId(buildIBeaconPayload(frame))))).toBe(513);
	});

	it("ignores another company's data, a non-iBeacon frame and a short one", () => {
		const payload = buildIBeaconPayload(eventBeaconFrame(1));
		expect(parseIBeacon([0x06, 0x00, ...payload])).toBeNull();
		expect(parseIBeacon(withCompanyId([0x10, ...payload.slice(1)]))).toBeNull();
		expect(parseIBeacon(withCompanyId(payload.slice(0, 10)))).toBeNull();
	});

	it("ignores an iBeacon that is not Zumik's", () => {
		const other = { ...eventBeaconFrame(7), uuid: 'f7826da6-4fa2-4e98-8024-bc5b71e0893e' };
		expect(zumikBeaconMinor(parseIBeacon(withCompanyId(buildIBeaconPayload(other))))).toBeNull();
	});
});

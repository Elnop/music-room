import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import {
	controlActionSchema,
	leaveListeningRoom,
	listeningTargetSchema,
	listeningUpdateSchema,
} from '@/realtime/music-control-access.js';
import type { AppSocketServer } from '@/realtime/socket-auth.js';

const ALICE = randomUUID();
const BOB = randomUUID();
const CAROL = randomUUID();

describe('listeningTargetSchema', () => {
	it('accepts a user id (UUID)', () => {
		expect(listeningTargetSchema.safeParse(ALICE)).toMatchObject({ success: true, data: ALICE });
	});

	it.each([
		['not a uuid', 'alice'],
		['empty string', ''],
		['number', 42],
		['null', null],
		['undefined', undefined],
		['object', { targetUserId: ALICE }],
	])('rejects %s', (_label, payload) => {
		expect(listeningTargetSchema.safeParse(payload).success).toBe(false);
	});
});

describe('controlActionSchema', () => {
	const valid = { targetUserId: ALICE, targetDeviceId: 'device-1', action: 'play' };

	it.each(['play', 'pause'])('accepts action %s', action => {
		expect(controlActionSchema.safeParse({ ...valid, action }).success).toBe(true);
	});

	it('strips sender fields from the payload', () => {
		const parsed = controlActionSchema.parse({
			...valid,
			fromUserId: BOB,
			controllerId: CAROL,
		});
		expect(parsed).toEqual(valid);
	});

	it.each([
		['null', null],
		['undefined', undefined],
		['a string', ALICE],
		['missing targetUserId', { targetDeviceId: 'device-1', action: 'play' }],
		['missing targetDeviceId', { targetUserId: ALICE, action: 'play' }],
		['missing action', { targetUserId: ALICE, targetDeviceId: 'device-1' }],
		['non-uuid targetUserId', { ...valid, targetUserId: 'alice' }],
		['empty targetDeviceId', { ...valid, targetDeviceId: '' }],
		['too long targetDeviceId', { ...valid, targetDeviceId: 'x'.repeat(129) }],
		['action not play/pause', { ...valid, action: 'skip' }],
	])('rejects %s', (_label, payload) => {
		expect(controlActionSchema.safeParse(payload).success).toBe(false);
	});
});

describe('leaveListeningRoom', () => {
	it("makes the controller's sockets leave the owner's listening room", () => {
		const socketsLeave = vi.fn();
		const inRoom = vi.fn(() => ({ socketsLeave }));
		const io = { in: inRoom } as unknown as AppSocketServer;

		leaveListeningRoom(io, BOB, ALICE);

		expect(inRoom).toHaveBeenCalledWith(`user:${BOB}`);
		expect(socketsLeave).toHaveBeenCalledWith(`listening:${ALICE}`);
	});

	it('never throws', () => {
		const io = {
			in: vi.fn(() => {
				throw new Error('adapter down');
			}),
		} as unknown as AppSocketServer;

		expect(() => leaveListeningRoom(io, BOB, ALICE)).not.toThrow();
	});
});

describe('listeningUpdateSchema positionMs (#295)', () => {
	const base = { track: null, isPlaying: true };

	it('accepts a payload without positionMs (older clients)', () => {
		expect(listeningUpdateSchema.parse(base)).toEqual(base);
	});

	it('accepts a whole, non-negative position', () => {
		expect(listeningUpdateSchema.parse({ ...base, positionMs: 61_500 }).positionMs).toBe(61_500);
	});

	it('rejects a negative, fractional or absurd position', () => {
		for (const positionMs of [-1, 1.5, 86_400_001]) {
			expect(listeningUpdateSchema.safeParse({ ...base, positionMs }).success).toBe(false);
		}
	});
});

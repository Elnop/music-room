import { describe, expect, it } from 'vitest';
import { resolveClientClass, soundcloud } from '@/shared/soundcloud/soundcloud-client.js';

class Client {
	tracks = {};
}
const asModule = (value: object) => value as Parameters<typeof resolveClientClass>[0];

describe('soundcloud-client', () => {
	it('builds one soundcloud.ts client with tracks and util.streamLink', () => {
		expect(typeof soundcloud.tracks.search).toBe('function');
		expect(typeof soundcloud.util?.streamLink).toBe('function');
	});

	it.each([
		['the module itself', Client],
		['default', { default: Client }],
		['Soundcloud', { Soundcloud: Client }],
		['default.default', { default: { default: Client } }],
		['default.Soundcloud', { default: { Soundcloud: Client } }],
	])('resolves the client class exported as %s', (_label, loaded) => {
		expect(resolveClientClass(asModule(loaded))).toBe(Client);
	});
});

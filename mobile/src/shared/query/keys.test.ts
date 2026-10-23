import { queryKeys } from './keys';

/** True when `prefix` is the start of `key`, as TanStack matches keys. */
function startsWith(key: readonly unknown[], prefix: readonly unknown[]): boolean {
	return prefix.every((part, index) => key[index] === part);
}

describe('queryKeys', () => {
	it('nests every key of a domain under its `all` prefix', () => {
		const keys = [
			[queryKeys.auth.all, queryKeys.auth.providers('u1')],
			[queryKeys.playlists.all, queryKeys.playlists.list()],
			[queryKeys.playlists.all, queryKeys.playlists.detail('p1')],
			[queryKeys.playlists.all, queryKeys.playlists.public()],
			[queryKeys.playlists.all, queryKeys.playlists.friends()],
			[queryKeys.playlists.all, queryKeys.playlists.members('p1')],
			[queryKeys.queue.all, queryKeys.queue.room('r1')],
			[queryKeys.queue.all, queryKeys.queue.detail('me')],
			[queryKeys.friends.all, queryKeys.friends.list()],
			[queryKeys.friends.all, queryKeys.friends.search('al')],
			[queryKeys.friends.all, queryKeys.friends.status('u1')],
			[queryKeys.friends.all, queryKeys.friends.stats()],
			[queryKeys.friends.all, queryKeys.friends.permissions()],
			[queryKeys.profile.all, queryKeys.profile.me()],
			[queryKeys.profile.all, queryKeys.profile.user('u1')],
			[queryKeys.devices.all, queryKeys.devices.list()],
			[queryKeys.devices.all, queryKeys.devices.picker()],
			[queryKeys.search.all, queryKeys.search.tracks('daft')],
		] as const;

		for (const [prefix, key] of keys) {
			expect(startsWith(key, prefix)).toBe(true);
		}
	});

	it('gives each domain its own root', () => {
		const roots = Object.values(queryKeys).map(domain => domain.all[0]);
		expect(new Set(roots).size).toBe(roots.length);
	});

	it('builds distinct keys for distinct ids', () => {
		expect(queryKeys.playlists.detail('a')).toEqual(['playlists', 'detail', 'a']);
		expect(queryKeys.playlists.detail('a')).not.toEqual(queryKeys.playlists.detail('b'));
	});
});

import { playlistFormSchema } from './validators';

describe('playlistFormSchema (#342)', () => {
	it('accepts a name of 50 characters, such as a long French title', () => {
		expect(playlistFormSchema.safeParse({ name: 'Les tubes du Crabe Croustillant' }).success).toBe(
			true
		);
		expect(playlistFormSchema.safeParse({ name: 'a'.repeat(50) }).success).toBe(true);
	});

	it('refuses 51 characters with a French message', () => {
		const result = playlistFormSchema.safeParse({ name: 'a'.repeat(51) });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe('Le nom doit faire 50 caractères maximum');
	});

	it('refuses an empty name', () => {
		expect(playlistFormSchema.safeParse({ name: '' }).success).toBe(false);
	});

	it('accepts a description of 500 characters, the backend limit, and refuses 501', () => {
		expect(
			playlistFormSchema.safeParse({ name: 'Mix', description: 'a'.repeat(500) }).success
		).toBe(true);
		const result = playlistFormSchema.safeParse({ name: 'Mix', description: 'a'.repeat(501) });
		expect(result.success).toBe(false);
		expect(result.error?.issues[0].message).toBe(
			'La description doit faire 500 caractères maximum'
		);
	});
});

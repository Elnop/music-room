import { sizedAvatarUri } from './avatarUri';

const GOOGLE = 'https://lh3.googleusercontent.com/a/ACg8ocIez2Qe';

describe('sizedAvatarUri', () => {
	it('asks Google for twice the drawn size', () => {
		expect(sizedAvatarUri(`${GOOGLE}=s96-c`, 120)).toBe(`${GOOGLE}=s240-c`);
	});

	it('keeps any other address as it is', () => {
		expect(sizedAvatarUri('https://cdn.example.com/a.jpg=s96-c', 120)).toBe(
			'https://cdn.example.com/a.jpg=s96-c'
		);
		expect(sizedAvatarUri(`${GOOGLE}?sz=50`, 120)).toBe(`${GOOGLE}?sz=50`);
	});
});

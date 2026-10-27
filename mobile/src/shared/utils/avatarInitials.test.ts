import { AVATAR_COLORS } from '@/shared/theme/tokens';
import { avatarColor, avatarInitials } from './avatarInitials';

describe('avatarInitials', () => {
	it('takes the first letter of the first two words', () => {
		expect(avatarInitials('john doe')).toBe('JD');
		expect(avatarInitials('  Patrick   Étoile  ')).toBe('PÉ');
	});

	it('takes a single letter for a single word', () => {
		expect(avatarInitials('perle')).toBe('P');
	});

	it('keeps an emoji whole', () => {
		expect(avatarInitials('🎸 rock')).toBe('🎸R');
	});

	it('shows a question mark without a name', () => {
		expect(avatarInitials()).toBe('?');
		expect(avatarInitials('   ')).toBe('?');
	});
});

describe('avatarColor', () => {
	it('gives a name always the same colour of the palette', () => {
		expect(avatarColor('Perle')).toBe(avatarColor('Perle'));
		expect(AVATAR_COLORS).toContain(avatarColor('Perle'));
	});

	it('spreads names over the palette', () => {
		const names = ['Bob', 'Patrick', 'Sandy', 'Carlo', 'Perle', 'Gary', 'Karen', 'Plankton'];
		expect(new Set(names.map(avatarColor)).size).toBeGreaterThan(4);
	});
});

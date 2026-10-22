import { membersTitle, noMembersMessage, sharingHeader } from './sharingTexts';

const modes = [
	{ isPrivate: true, isEditRestricted: true },
	{ isPrivate: true, isEditRestricted: false },
	{ isPrivate: false, isEditRestricted: true },
	{ isPrivate: false, isEditRestricted: false },
];

describe('sharingTexts', () => {
	it('titles each mode', () => {
		expect(modes.map(mode => sharingHeader(mode).title)).toEqual([
			'Accès et modification',
			'Accès',
			'Éditeurs',
			'Playlist ouverte à tous',
		]);
	});

	it('counts the members by what they are', () => {
		expect(modes.map(mode => membersTitle(mode, 2))).toEqual([
			'Personnes ayant accès (2)',
			'Invités (2)',
			'Éditeurs (2)',
			'Éditeurs (2)',
		]);
	});

	it('says who is missing', () => {
		expect(noMembersMessage(modes[0])).toBe("Personne n'a encore accès à cette playlist");
		expect(noMembersMessage(modes[2])).toBe('Aucun éditeur ajouté');
	});
});

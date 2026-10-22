/**
 * What « Visibilité et droits » manages, by visibility and edit mode:
 *
 * | visibility | editMode   | Managed                                     |
 * |------------|------------|---------------------------------------------|
 * | public     | open       | Info only - everyone can edit               |
 * | public     | restricted | Editors (collaborators)                     |
 * | private    | open       | Access (viewers, who can also edit)         |
 * | private    | restricted | Access (viewers) and editors (collaborators) |
 */
export interface SharingMode {
	isPrivate: boolean;
	isEditRestricted: boolean;
}

export function sharingHeader({ isPrivate, isEditRestricted }: SharingMode) {
	if (isPrivate && isEditRestricted) {
		return {
			title: 'Accès et modification',
			subtitle: 'Gérez qui peut voir cette playlist et qui peut la modifier.',
		};
	}
	if (isPrivate) {
		return {
			title: 'Accès',
			subtitle:
				'Gérez qui peut voir et modifier cette playlist privée. Tous les invités peuvent la modifier.',
		};
	}
	if (isEditRestricted) {
		return { title: 'Éditeurs', subtitle: 'Gérez qui peut modifier cette playlist publique.' };
	}
	return { title: 'Playlist ouverte à tous', subtitle: 'Cette playlist est ouverte à tous.' };
}

export function membersTitle({ isPrivate, isEditRestricted }: SharingMode, count: number): string {
	if (isPrivate && isEditRestricted) return `Personnes ayant accès (${count})`;
	if (isPrivate) return `Invités (${count})`;
	return `Éditeurs (${count})`;
}

export function noMembersMessage({ isPrivate }: SharingMode): string {
	return isPrivate ? "Personne n'a encore accès à cette playlist" : 'Aucun éditeur ajouté';
}

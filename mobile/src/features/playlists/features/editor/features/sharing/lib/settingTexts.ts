export function visibilityDescription(isPrivate: boolean): string {
	return isPrivate ? 'Privée : visible uniquement par les invités' : 'Publique : visible par tous';
}

export function editModeDescription(isEditRestricted: boolean): string {
	return isEditRestricted
		? 'Restreint : seuls les éditeurs peuvent modifier'
		: 'Ouvert : tout le monde peut modifier';
}

export function memberSinceLabel(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

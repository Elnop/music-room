export function sameName(model: string, deviceName: string): boolean {
	return model.trim().toLowerCase() === deviceName.trim().toLowerCase();
}

export function formatLastSeen(lastSeenAt: string): string {
	const date = new Date(lastSeenAt);
	if (Number.isNaN(date.getTime())) return '';
	return `Vu le ${date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`;
}

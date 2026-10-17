// Time Formatters
export const formatDuration = (ms: number): string => {
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const formatDate = (date: string | Date): string => {
	const d = new Date(date);
	return d.toLocaleDateString('fr-FR', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
};

export const formatRelativeTime = (date: string | Date): string => {
	const now = new Date();
	const past = new Date(date);
	const diffMs = now.getTime() - past.getTime();
	const diffMins = Math.floor(diffMs / 60000);

	if (diffMins < 1) return "à l'instant";
	if (diffMins < 60) return `il y a ${diffMins} min`;

	const diffHours = Math.floor(diffMins / 60);
	if (diffHours < 24) return `il y a ${diffHours} h`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `il y a ${diffDays} j`;

	return formatDate(date);
};

// String Formatters
export const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
	return text.charAt(0).toUpperCase() + text.slice(1);
};

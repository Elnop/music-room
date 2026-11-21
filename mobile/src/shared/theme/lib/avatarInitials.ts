import { AVATAR_COLORS } from '@/shared/theme/lib/tokens';

export function avatarInitials(name?: string): string {
	const words = name?.trim().split(/\s+/u).filter(Boolean) ?? [];
	if (words.length === 0) return '?';
	function first(word: string) {
		return Array.from(word)[0].toUpperCase();
	}
	return words.length >= 2 ? first(words[0]) + first(words[1]) : first(words[0]);
}

export function avatarColor(name: string): string {
	let hash = 0;
	for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
	return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

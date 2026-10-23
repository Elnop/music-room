import type { VisibilityLevel } from '@/features/profile/profile.types.js';

/** The owner sees every field. */
export function isFieldVisible(
	visibility: VisibilityLevel,
	isOwnProfile: boolean,
	isFriend: boolean
): boolean {
	if (isOwnProfile) return true;

	switch (visibility) {
		case 'public':
			return true;
		case 'friends_only':
			return isFriend;
		case 'private':
			return false;
		default:
			return false;
	}
}

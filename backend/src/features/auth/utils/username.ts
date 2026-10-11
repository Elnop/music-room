// Length bounds of user_profiles.username (CHECK in 001_initial_schema.sql),
// shared by the register validator and the OAuth username generator
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/** Username base from a display name: lowercase letters and digits, cut to the maximum length. */
export function usernameBase(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, USERNAME_MAX_LENGTH);
}

/** Appends suffix, cutting the username so the result stays within the maximum length. */
export function withSuffix(username: string, suffix: string): string {
	return `${username.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
}

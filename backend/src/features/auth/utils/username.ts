export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

export function usernameBase(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '')
		.slice(0, USERNAME_MAX_LENGTH);
}

export function withSuffix(username: string, suffix: string): string {
	return `${username.slice(0, USERNAME_MAX_LENGTH - suffix.length)}${suffix}`;
}

const GOOGLE_SIZE_SUFFIX = /^(https:\/\/lh\d\.googleusercontent\.com\/.+)=s\d+(-c)?$/;

/** A Google profile photo is served at the size its URL asks for (96 px by default): ask for twice the drawn size. */
export function sizedAvatarUri(uri: string, size: number): string {
	const match = GOOGLE_SIZE_SUFFIX.exec(uri);
	return match ? `${match[1]}=s${size * 2}-c` : uri;
}

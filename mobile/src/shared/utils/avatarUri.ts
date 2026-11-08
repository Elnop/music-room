const GOOGLE_SIZE_SUFFIX = /^(https:\/\/lh\d\.googleusercontent\.com\/.+)=s\d+(-c)?$/;

export function sizedAvatarUri(uri: string, size: number): string {
	const match = GOOGLE_SIZE_SUFFIX.exec(uri);
	return match ? `${match[1]}=s${size * 2}-c` : uri;
}

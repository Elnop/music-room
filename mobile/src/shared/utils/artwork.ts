const SOUNDCLOUD_LARGE = /^(https?:\/\/(?:[^/.]+\.)*sndcdn\.com\/.+)-large(\.\w+)(\?.*)?$/;

export function largeArtwork(url: string | null | undefined): string | null {
	if (!url) return null;
	return url.replace(SOUNDCLOUD_LARGE, '$1-t500x500$2$3');
}

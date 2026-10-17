/** SoundCloud CDN images come in named sizes; the API hands out `-large` (100×100). */
const SOUNDCLOUD_LARGE = /^(https?:\/\/(?:[^/.]+\.)*sndcdn\.com\/.+)-large(\.\w+)(\?.*)?$/;

/**
 * The 500×500 variant of a SoundCloud artwork or avatar URL, for images shown
 * big (full-screen player, lock screen). Any other URL comes back unchanged.
 */
export function largeArtwork(url: string | null | undefined): string | null {
	if (!url) return null;
	return url.replace(SOUNDCLOUD_LARGE, '$1-t500x500$2$3');
}

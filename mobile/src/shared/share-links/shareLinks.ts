export const LINK_PREFIX = 'zumik://';

const SHARE_URL = 'https://elnop.github.io/music-room/';

export function playlistLink(id: string): string {
	return `${SHARE_URL}playlist/${id}`;
}

export function userLink(id: string): string {
	return `${SHARE_URL}user/${id}`;
}

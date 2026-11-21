export const LINK_PREFIX = 'zumik://';

const SHARE_URL = 'https://elnop.github.io/music-room/';

export const playlistLink = (id: string): string => `${SHARE_URL}playlist/${id}`;

export const userLink = (id: string): string => `${SHARE_URL}user/${id}`;

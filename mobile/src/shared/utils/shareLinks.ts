/** navigation/linking.ts opens these links. */
export const LINK_PREFIX = 'zumik://';

/** Messaging apps make only http(s) links clickable: a shared link opens the web app, which offers the Android app. */
const SHARE_URL = 'https://elnop.github.io/music-room/';

export const playlistLink = (id: string): string => `${SHARE_URL}playlist/${id}`;

export const userLink = (id: string): string => `${SHARE_URL}user/${id}`;

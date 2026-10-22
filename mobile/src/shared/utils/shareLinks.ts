/** The scheme of the zumik:// share links (#321); navigation/linking.ts opens them. */
export const LINK_PREFIX = 'zumik://';

export const playlistLink = (id: string): string => `${LINK_PREFIX}playlist/${id}`;

export const userLink = (id: string): string => `${LINK_PREFIX}user/${id}`;

/** navigation/linking.ts opens these links. */
export const LINK_PREFIX = 'zumik://';

export const playlistLink = (id: string): string => `${LINK_PREFIX}playlist/${id}`;

export const userLink = (id: string): string => `${LINK_PREFIX}user/${id}`;

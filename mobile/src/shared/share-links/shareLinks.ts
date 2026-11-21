import { SHARE_URL } from '@/shared/share-links/shareLinksConfig';

export function playlistLink(id: string): string {
	return `${SHARE_URL}playlist/${id}`;
}

export function userLink(id: string): string {
	return `${SHARE_URL}user/${id}`;
}

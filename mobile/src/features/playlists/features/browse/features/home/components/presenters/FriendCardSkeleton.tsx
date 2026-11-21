import React from 'react';
import { PlaylistCardSkeleton } from '@/shared/theme/components/Skeleton';
import { FRIEND_CARD_WIDTH } from '@/features/playlists/features/browse/features/home/friendCardConfig';

export function FriendCardSkeleton() {
	return <PlaylistCardSkeleton width={FRIEND_CARD_WIDTH} />;
}

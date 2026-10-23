import React from 'react';
import { PlaylistCardSkeleton } from '@/shared/components/ui/Skeleton';
import { FRIEND_CARD_WIDTH } from './FriendPlaylistCarousel';

/** A card of the friends' carousel while it loads. */
export function FriendCardSkeleton() {
	return <PlaylistCardSkeleton width={FRIEND_CARD_WIDTH} />;
}

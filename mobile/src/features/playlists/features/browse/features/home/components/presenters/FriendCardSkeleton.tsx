import React from 'react';
import { PlaylistCardSkeleton } from '@/shared/theme/components/Skeleton';
import { FRIEND_CARD_WIDTH } from './FriendPlaylistCarousel';

export function FriendCardSkeleton() {
	return <PlaylistCardSkeleton width={FRIEND_CARD_WIDTH} />;
}

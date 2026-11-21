import React from 'react';
import { DetailSkeleton } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailSkeleton';
import { LoadFailure } from '@/features/playlists/features/editor/features/detail/components/presenters/LoadFailure';
import type { PlaylistDetailScreen } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

type DetailFallbackProps = {
	screen: Pick<PlaylistDetailScreen, 'failure' | 'retry'>;
};

export function DetailFallback({ screen }: DetailFallbackProps) {
	if (!screen.failure) return <DetailSkeleton />;
	return <LoadFailure notFound={screen.failure === 'notFound'} onRetry={screen.retry} />;
}

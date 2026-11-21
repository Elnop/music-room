import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { Text } from '@/shared/theme/components/Text';
import { useQueueModalStyles } from '@/features/playback/features/queue-modal/hooks/useQueueModalStyles';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

type QueueListEmptyProps = {
	hasCurrent: boolean;
};

export function QueueListEmpty({ hasCurrent }: QueueListEmptyProps) {
	const styles = useQueueModalStyles();
	if (hasCurrent) return <Text style={styles.nothingNext}>Rien à suivre</Text>;
	return <EmptyState message="La file d'attente est vide" icon={PlaylistSolid} />;
}

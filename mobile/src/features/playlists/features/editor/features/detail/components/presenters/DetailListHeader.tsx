import React from 'react';
import { TrackTableHeader } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableHeader';

type DetailListHeaderProps = {
	header: React.ReactElement;
	table: boolean;
};

export function DetailListHeader({ header, table }: DetailListHeaderProps) {
	return (
		<>
			{header}
			{table && <TrackTableHeader />}
		</>
	);
}

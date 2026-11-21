import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/playerSheetsTypes';
import { PlayerBarActions } from '@/features/playback/features/player-bar/components/presenters/PlayerBarActions';
import { PlayerBarControls } from '@/features/playback/features/player-bar/components/presenters/PlayerBarControls';
import { PlayerBarProgress } from '@/features/playback/features/player-bar/components/presenters/PlayerBarProgress';
import { PlayerBarTrack } from '@/features/playback/features/player-bar/components/presenters/PlayerBarTrack';
import type { PlayerBarData } from '@/features/playback/features/player-bar/playerBarTypes';

const CENTER_MAX_WIDTH = 640;

type PlayerBarViewProps = PlayerSheets & {
	data: PlayerBarData;
};

export function PlayerBarView({ data, QueueModal, DevicePicker }: PlayerBarViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const { sheets } = data;

	return (
		<View style={styles.container}>
			<PlayerBarTrack nowPlaying={data.nowPlaying} panel={data.panel} />
			<View style={styles.center}>
				<PlayerBarControls nowPlaying={data.nowPlaying} transport={data.transport} />
				<PlayerBarProgress playback={data} />
			</View>
			<PlayerBarActions data={data} />
			<QueueModal visible={sheets.isQueueOpen} onClose={sheets.onCloseQueue} />
			<DevicePicker visible={sheets.isDevicesOpen} onClose={sheets.onCloseDevices} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			height: theme.controls.playerBar,
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			gap: theme.spacing.md,
			backgroundColor: theme.colors.background,
		},
		center: { flex: 2, flexBasis: 0, maxWidth: CENTER_MAX_WIDTH, alignItems: 'stretch' },
	});
	return styles;
}

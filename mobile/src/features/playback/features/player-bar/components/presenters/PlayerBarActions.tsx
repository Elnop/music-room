import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PlayerBarButton } from '@/features/playback/features/player-bar/components/presenters/PlayerBarButton';
import { PlayerBarVolumeControl } from '@/features/playback/features/player-bar/components/presenters/PlayerBarVolumeControl';
import type { PlayerBarData } from '@/features/playback/features/player-bar/playerBarTypes';
import CassetteTapeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cassette-tape-solid.svg';
import PhoneRingingLowSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/phone-ringing-low-solid.svg';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

type PlayerBarActionsProps = {
	data: PlayerBarData;
};

export function PlayerBarActions({ data }: PlayerBarActionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const { panel, sheets } = data;

	return (
		<View style={[styles.side, styles.sideEnd]}>
			<PlayerBarButton
				icon={CassetteTapeSolid}
				label={panel.label}
				onPress={panel.onToggle}
				state={{ selected: panel.isOpen }}
			/>
			<PlayerBarButton icon={PlaylistSolid} label="File d'attente" onPress={sheets.onOpenQueue} />
			<PlayerBarButton
				icon={PhoneRingingLowSolid}
				label="Choisir l'appareil"
				onPress={sheets.onOpenDevices}
				state={{ selected: data.nowPlaying.isRemote }}
			/>
			<PlayerBarVolumeControl volume={data.volume} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		side: { flex: 1, flexBasis: 0, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
		sideEnd: { justifyContent: 'flex-end', gap: theme.spacing.xs },
	});
	return styles;
}

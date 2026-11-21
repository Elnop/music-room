import React from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyButton } from '@/shared/theme/components/KeyButton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerDeviceKey } from '@/features/playback/features/player-modal/components/presenters/PlayerDeviceKey';
import type { Theme } from '@/shared/theme/types/themeTypes';
import PlaylistSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/playlist-solid.svg';

type PlayerBottomBarProps = {
	deviceLabel: string | null;
	onOpenDevices: () => void;
	onOpenQueue: () => void;
};

export function PlayerBottomBar({ deviceLabel, onOpenDevices, onOpenQueue }: PlayerBottomBarProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.bottomBar}>
			<PlayerDeviceKey deviceLabel={deviceLabel} onOpenDevices={onOpenDevices} />
			<KeyButton
				icon={PlaylistSolid}
				onPress={onOpenQueue}
				accessibilityLabel="File d'attente"
				appearance={{ size: 54 }}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		bottomBar: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.md,
			paddingHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
	});
	return styles;
}

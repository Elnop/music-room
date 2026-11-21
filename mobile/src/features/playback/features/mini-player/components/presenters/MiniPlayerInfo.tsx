import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { MiniPlayerArtwork } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerArtwork';
import { MiniPlayerRemoteLine } from '@/features/playback/features/mini-player/components/presenters/MiniPlayerRemoteLine';
import type { MiniPlayerData } from '@/features/playback/features/mini-player/miniPlayerTypes';

type MiniPlayerInfoProps = {
	data: MiniPlayerData;
};

export function MiniPlayerInfo({ data }: MiniPlayerInfoProps) {
	const { styles } = useThemedStyles(createStyles);
	const { track, deviceLabel } = data;

	return (
		<Pressable
			style={styles.infoButton}
			onPress={data.onToggleModal}
			accessibilityRole="button"
			accessibilityLabel={data.openLabel}
		>
			<MiniPlayerArtwork track={track} />
			<View style={styles.info}>
				<Text style={styles.title} numberOfLines={1}>
					{track ? track.title : 'Rien en lecture'}
				</Text>
				<Text style={styles.artist} numberOfLines={1}>
					{track ? track.artist : 'Choisissez un titre pour commencer'}
				</Text>
				{deviceLabel ? (
					<MiniPlayerRemoteLine deviceLabel={deviceLabel} isPlaying={data.isPlaying} />
				) : null}
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		infoButton: { flexDirection: 'row', alignItems: 'center' },
		info: { flex: 1, marginRight: theme.spacing.sm },
		title: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
			marginBottom: theme.spacing.xxs,
		},
		artist: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
	});
	return styles;
}

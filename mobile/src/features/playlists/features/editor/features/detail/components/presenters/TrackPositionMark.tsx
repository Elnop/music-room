import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { TrackRowState } from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';

type TrackPositionMarkProps = {
	position: number;
	state: TrackRowState;
	showPlay: boolean;
};

export function TrackPositionMark({ position, state, showPlay }: TrackPositionMarkProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (state.isPending) {
		return (
			<ActivityIndicator size="small" color={theme.colors.primary} accessibilityLabel="Lancement" />
		);
	}
	if (showPlay) return <PixelIcon icon={PlaySolid} size={16} color={theme.colors.text} />;
	if (!state.isCurrent) return <Text style={styles.position}>{position}</Text>;
	return (
		<PixelIcon
			icon={SoundOnSolid}
			size={16}
			color={theme.colors.primary}
			accessibilityLabel="En cours de lecture"
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		position: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
	});
	return styles;
}

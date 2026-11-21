import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import SoundMuteSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-mute-solid.svg';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';

type NowPlayingTitleProps = {
	title: string;
	isPlaying: boolean;
};

export function NowPlayingTitle({ title, isPlaying }: NowPlayingTitleProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.titleRow}>
			<PixelIcon
				icon={isPlaying ? SoundOnSolid : SoundMuteSolid}
				size={12}
				color={isPlaying ? theme.colors.primary : theme.colors.textSecondary}
				style={styles.volumeIcon}
			/>
			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		titleRow: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		volumeIcon: {
			marginRight: theme.spacing.xs,
		},
		title: {
			flex: 1,
			fontSize: theme.typography.sizes.smd,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}

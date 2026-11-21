import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import {
	HEADER_BUTTON_SIZE,
	HEADER_HIT_SLOP,
} from '@/features/playback/features/player-modal/playerModalConfig';
import type { ScreenInsets } from '@/features/playback/features/player-modal/playerModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import ChevronDownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/chevron-down-solid.svg';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type PlayerCloseKeyProps = {
	dialog: boolean;
	onClose: () => void;
};

export function PlayerCloseKey({ dialog, onClose }: PlayerCloseKeyProps) {
	const { styles, theme } = useInsetStyles(createStyles);

	return (
		<Pressable
			style={styles.closeButton}
			onPress={onClose}
			hitSlop={HEADER_HIT_SLOP}
			accessibilityRole="button"
			accessibilityLabel="Fermer le lecteur"
		>
			<View style={styles.headerButton}>
				{dialog ? (
					<PixelIcon icon={TimesSolid} size={24} color={theme.colors.text} />
				) : (
					<PixelIcon icon={ChevronDownSolid} color={theme.colors.text} />
				)}
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme, insets: ScreenInsets) {
	const styles = StyleSheet.create({
		closeButton: {
			position: 'absolute',
			top: insets.top + theme.spacing.md,
			left: theme.spacing.mdl,
			zIndex: 10,
		},
		headerButton: {
			...pixelFrame(theme),
			width: HEADER_BUTTON_SIZE,
			height: HEADER_BUTTON_SIZE,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}

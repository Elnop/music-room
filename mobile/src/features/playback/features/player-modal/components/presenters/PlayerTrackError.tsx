import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import {
	backgroundColor,
	textColor,
} from '@/features/playback/features/player-modal/lib/dynamicStyles';
import type { PlayerColors } from '@/features/playback/features/player-modal/playerModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';

type PlayerTrackErrorProps = {
	error: string | null;
	isRemote: boolean;
	colors: Pick<PlayerColors, 'error' | 'errorBg'>;
};

export function PlayerTrackError({ error, isRemote, colors }: PlayerTrackErrorProps) {
	const { styles } = useThemedStyles(createStyles);
	if (!error || isRemote) return null;

	return (
		<View style={[styles.errorContainer, backgroundColor(colors.errorBg)]}>
			<PixelIcon icon={ExclamationTriangleSolid} size={16} color={colors.error} />
			<Text style={[styles.errorText, textColor(colors.error)]}>{error}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		errorContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: theme.spacing.sml,
			paddingHorizontal: theme.spacing.md,
			marginHorizontal: theme.spacing.xl,
			marginBottom: theme.spacing.md,
			gap: theme.spacing.sm,
		},
		errorText: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}

import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type ProfilePreferencesEmptyProps = {
	onPress: () => void;
};

export function ProfilePreferencesEmpty({ onPress }: ProfilePreferencesEmptyProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.emptyState}
			onPress={onPress}
			accessibilityLabel="Modifier les préférences musicales"
		>
			<PixelIcon
				icon={MusicSolid}
				size={32}
				color={theme.colors.textSecondary}
				style={styles.emptyStateIcon}
			/>
			<Text style={styles.emptyStateText}>Ajoutez vos genres préférés</Text>
			<Text style={styles.emptyStateHint}>Touchez pour en choisir jusqu'à 5</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		emptyState: {
			alignItems: 'center',
			paddingVertical: theme.spacing.lg,
		},
		emptyStateIcon: {
			marginBottom: theme.spacing.sm,
			opacity: 0.6,
		},
		emptyStateText: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
		},
		emptyStateHint: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}

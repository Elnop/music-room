import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

export function AddTrackRow({ onPress }: { onPress: () => void }) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable style={styles.row} onPress={onPress} accessibilityLabel="Ajouter un titre">
			<View style={styles.icon}>
				<PixelIcon icon={PlusSolid} size={24} color={theme.colors.textSecondary} />
			</View>
			<Text style={styles.text}>Ajouter un titre</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			alignSelf: 'stretch',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
			marginHorizontal: -theme.spacing.lg,
		},
		icon: {
			width: 48,
			height: 48,
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
		},
		text: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
			marginLeft: theme.spacing.md,
		},
	});
}

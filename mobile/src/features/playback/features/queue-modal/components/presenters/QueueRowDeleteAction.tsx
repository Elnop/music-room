import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import TrashSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/trash-solid.svg';

const DELETE_ACTION_WIDTH = 100;

type QueueRowDeleteActionProps = {
	title: string;
	onRemove: () => void;
};

export function QueueRowDeleteAction({ title, onRemove }: QueueRowDeleteActionProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.deleteButton}
			onPress={onRemove}
			accessibilityRole="button"
			accessibilityLabel={`Retirer ${title}`}
		>
			<PixelIcon icon={TrashSolid} size={24} color={theme.colors.onColor} />
			<Text style={styles.deleteText}>Retirer</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		deleteButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: DELETE_ACTION_WIDTH,
			height: '100%',
		},
		deleteText: {
			color: theme.colors.onColor,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			marginTop: theme.spacing.xs,
		},
	});
	return styles;
}

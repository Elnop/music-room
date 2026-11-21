import React from 'react';
import { StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

type BylineCollaboratorsProps = {
	label: string;
};

export function BylineCollaborators({ label }: BylineCollaboratorsProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.separator}>•</Text>
			<PixelIcon icon={UsersSolid} size={14} color={theme.colors.primary} />
			<Text style={styles.collaborators}>{label}</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginHorizontal: theme.spacing.xs,
		},
		collaborators: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}

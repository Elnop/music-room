import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VisibilityOptions } from '@/features/user/features/profile/features/privacy-settings/components/presenters/VisibilityOptions';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { VisibilityLevel } from '@/shared/users/userTypes';
import { Text } from '@/shared/theme/components/Text';

type VisibilityToggleProps = {
	label: string;
	description?: string;
	value: VisibilityLevel;
	onChange: (value: VisibilityLevel) => void;
};

export function VisibilityToggle({ label, description, value, onChange }: VisibilityToggleProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.toggleGroup}>
			<View style={styles.labelBlock}>
				<Text style={styles.label}>{label}</Text>
				{description && <Text style={styles.description}>{description}</Text>}
			</View>

			<VisibilityOptions value={value} onChange={onChange} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		toggleGroup: {
			marginBottom: theme.spacing.lg,
		},
		labelBlock: {
			marginBottom: theme.spacing.sm,
		},
		label: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		description: {
			fontSize: theme.typography.sizes.smd,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
	});
	return styles;
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VisibilityOption } from '@/features/user/features/profile/features/privacy-settings/components/presenters/VisibilityOption';
import { VISIBILITY_OPTIONS } from '@/features/user/features/profile/features/privacy-settings/privacyTogglesConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { VisibilityLevel } from '@/shared/users/userTypes';

type VisibilityOptionsProps = {
	value: VisibilityLevel;
	onChange: (value: VisibilityLevel) => void;
};

export function VisibilityOptions({ value, onChange }: VisibilityOptionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.options}>
			{VISIBILITY_OPTIONS.map(option => (
				<VisibilityOption
					key={option}
					option={option}
					isSelected={value === option}
					onSelect={onChange}
				/>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		options: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.xs,
			gap: theme.spacing.xs,
		},
	});
	return styles;
}

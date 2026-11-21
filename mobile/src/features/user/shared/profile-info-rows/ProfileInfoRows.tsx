import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';
import type { ProfileInfoRow } from '@/features/user/shared/profile-info-rows/profileInfoRowsTypes';

type ProfileInfoRowsProps = {
	rows: ProfileInfoRow[];
};

export function ProfileInfoRows({ rows }: ProfileInfoRowsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			{rows.map((row, i) => (
				<React.Fragment key={row.label}>
					{i > 0 && <View style={styles.divider} />}
					<View style={styles.infoItem}>
						<Text style={styles.infoLabel}>{row.label}</Text>
						<Text style={styles.infoValue}>{row.value}</Text>
					</View>
				</React.Fragment>
			))}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		infoItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		infoLabel: {
			fontSize: theme.typography.sizes.mlg,
			color: theme.colors.textSecondary,
		},
		infoValue: {
			fontSize: theme.typography.sizes.mlg,
			color: theme.colors.text,
			fontFamily: theme.typography.families.medium,
		},
		divider: {
			height: theme.borders.hairline,
			backgroundColor: theme.colors.border,
		},
	});
	return styles;
}

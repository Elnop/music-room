import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { Text } from '@/shared/components/ui/Text';

export interface ProfileInfoRow {
	label: string;
	value: string;
}

/** A profile's facts, label on the left and value on the right, divided by a rule. */
export function ProfileInfoRows({ rows }: { rows: ProfileInfoRow[] }) {
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

/** "janvier 2026": the month a profile was created. */
export function memberSinceLabel(createdAt: string): string {
	const date = new Date(createdAt);
	if (Number.isNaN(date.getTime())) return '';
	return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		infoItem: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingVertical: theme.spacing.sm,
		},
		infoLabel: {
			fontSize: 15,
			color: theme.colors.textSecondary,
		},
		infoValue: {
			fontSize: 15,
			color: theme.colors.text,
			fontFamily: theme.typography.families.medium,
		},
		divider: {
			height: 1,
			backgroundColor: theme.colors.border,
		},
	});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';
import type { WideProfileIdentity } from '@/features/user/shared/wide-profile-header/wideProfileHeaderTypes';

type WideProfileStatsProps = {
	identity: WideProfileIdentity;
};

export function WideProfileStats({ identity }: WideProfileStatsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.stats}>
			<Text style={styles.stat}>
				<Text style={styles.statValue}>{identity.followersCount}</Text> Abonnés
			</Text>
			<Text style={styles.stat}>
				<Text style={styles.statValue}>{identity.followingCount}</Text> Abonnements
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		stats: {
			flexDirection: 'row',
			gap: theme.spacing.lg,
			marginTop: theme.spacing.sm,
		},
		stat: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
		statValue: {
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
	});
	return styles;
}

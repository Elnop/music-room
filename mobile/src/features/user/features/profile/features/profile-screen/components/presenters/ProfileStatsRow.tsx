import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileStat } from '@/features/user/shared/profile-stat/ProfileStat';
import type { UserStats } from '@/features/user/features/profile/profileTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ProfileStatsRowProps = {
	stats?: UserStats | null;
};

export function ProfileStatsRow({ stats }: ProfileStatsRowProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.statsRow}>
			<ProfileStat value={stats?.followersCount ?? 0} label="Abonnés" variant="own" />
			<View style={styles.statDivider} />
			<ProfileStat value={stats?.followingCount ?? 0} label="Abonnements" variant="own" />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		statsRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
			paddingVertical: theme.spacing.md,
			paddingHorizontal: theme.spacing.xl,
		},
		statDivider: {
			width: theme.borders.hairline,
			height: theme.controls.statDivider,
			backgroundColor: theme.colors.border,
		},
	});
	return styles;
}

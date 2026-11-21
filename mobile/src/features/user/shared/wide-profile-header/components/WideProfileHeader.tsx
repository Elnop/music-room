import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';
import { WideProfileHandle } from '@/features/user/shared/wide-profile-header/components/WideProfileHandle';
import { WideProfileStats } from '@/features/user/shared/wide-profile-header/components/WideProfileStats';
import { WideProfileTitle } from '@/features/user/shared/wide-profile-header/components/WideProfileTitle';
import type { WideProfileIdentity } from '@/features/user/shared/wide-profile-header/wideProfileHeaderTypes';

type WideProfileHeaderProps = {
	identity: WideProfileIdentity;
	badges?: React.ReactNode;
	notes?: React.ReactNode;
	actions: React.ReactNode;
};

export function WideProfileHeader({ identity, badges, notes, actions }: WideProfileHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<Avatar size="xl" name={identity.name} uri={identity.avatarUrl} />
			<View style={styles.details}>
				<WideProfileTitle kind={identity.kind} name={identity.name} />
				<WideProfileHandle username={identity.username} badges={badges} />
				{Boolean(identity.bio) && (
					<Text style={styles.bio} numberOfLines={3}>
						{identity.bio}
					</Text>
				)}
				{notes}
				<WideProfileStats identity={identity} />
				<View style={styles.actions}>{actions}</View>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.lg,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xl,
			paddingBottom: theme.spacing.lg,
		},
		details: { flex: 1, minWidth: 0 },
		bio: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.sm,
		},
		actions: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			gap: theme.spacing.sm,
			marginTop: theme.spacing.md,
		},
	});
	return styles;
}

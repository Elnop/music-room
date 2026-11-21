import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { RecommendedProfile } from '@/features/user/features/friends/friendsTypes';
import {
	profileName,
	similarProfileLabel,
} from '@/features/user/features/friends/features/similar-profiles/similarProfileLabels';
import { SIMILAR_CARD_WIDTH } from '@/features/user/features/friends/features/similar-profiles/similarProfilesConfig';

type SimilarProfileCardProps = {
	profile: RecommendedProfile;
	onOpen: (userId: string) => void;
};

export function SimilarProfileCard({ profile, onOpen }: SimilarProfileCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const name = profileName(profile);

	return (
		<Pressable
			style={styles.card}
			onPress={() => onOpen(profile.id)}
			accessibilityLabel={similarProfileLabel(profile)}
		>
			<Avatar uri={profile.avatarUrl} name={name} size="xl" />
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		card: {
			width: SIMILAR_CARD_WIDTH,
			marginRight: theme.spacing.md,
			alignItems: 'center',
			padding: theme.spacing.smd,
			backgroundColor: theme.colors.surface,
		},
		name: {
			marginTop: theme.spacing.sm,
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});
	return styles;
}

import React from 'react';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { RecommendedProfile } from '@/features/user/features/friends/types';
import {
	profileName,
	similarProfileLabel,
} from '@/features/user/features/friends/features/similar-profiles/similarProfileLabels';
import { createSimilarProfilesStyles } from './similarProfilesStyles';

interface SimilarProfileCardProps {
	profile: RecommendedProfile;
	onOpen: (userId: string) => void;
}

export function SimilarProfileCard({ profile, onOpen }: SimilarProfileCardProps) {
	const { styles } = useThemedStyles(createSimilarProfilesStyles);
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

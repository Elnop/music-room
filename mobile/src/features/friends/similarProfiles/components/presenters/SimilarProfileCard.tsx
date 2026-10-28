import React from 'react';
import { Avatar } from '@/shared/components/media/Avatar';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { RecommendedProfile } from '@/features/friends/types';
import {
	profileName,
	similarProfileLabel,
} from '@/features/friends/similarProfiles/utils/similarProfileLabels';
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

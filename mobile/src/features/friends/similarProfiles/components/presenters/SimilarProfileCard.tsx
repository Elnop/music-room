import React from 'react';
import { Avatar } from '@/shared/components/media/Avatar';
import { Button } from '@/shared/components/ui/Button';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { RecommendedProfile } from '@/features/friends/types';
import {
	commonGenresLabel,
	profileName,
	similarProfileLabel,
} from '@/features/friends/similarProfiles/utils/similarProfileLabels';
import { createSimilarProfilesStyles } from './similarProfilesStyles';

interface SimilarProfileCardProps {
	profile: RecommendedProfile;
	isFollowing: boolean;
	onOpen: (userId: string) => void;
	onFollow: (userId: string) => void;
}

export function SimilarProfileCard({
	profile,
	isFollowing,
	onOpen,
	onFollow,
}: SimilarProfileCardProps) {
	const { styles } = useThemedStyles(createSimilarProfilesStyles);
	const name = profileName(profile);

	return (
		<Pressable
			style={styles.card}
			onPress={() => onOpen(profile.id)}
			accessibilityLabel={similarProfileLabel(profile)}
		>
			<Avatar uri={profile.avatarUrl} name={name} size="lg" />
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
			<Text style={styles.genres} numberOfLines={2}>
				{commonGenresLabel(profile.commonGenres)}
			</Text>
			<Button
				title="Suivre"
				size="compact"
				loading={isFollowing}
				onPress={() => onFollow(profile.id)}
				accessibilityLabel={`Suivre ${name}`}
			/>
		</Pressable>
	);
}

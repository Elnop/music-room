import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { SimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';
import { SIMILAR_CARD_WIDTH } from '@/features/user/features/friends/features/similar-profiles/similarProfilesConfig';
import { SimilarProfileCard } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfileCard';

type SimilarProfilesCarouselProps = {
	section: SimilarProfilesSection;
};

export function SimilarProfilesCarousel({ section }: SimilarProfilesCarouselProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.scrollContent}
			decelerationRate="fast"
			snapToInterval={SIMILAR_CARD_WIDTH + theme.spacing.md}
		>
			{section.profiles.map(profile => (
				<SimilarProfileCard key={profile.id} profile={profile} onOpen={section.openProfile} />
			))}
		</ScrollView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		scrollContent: {
			paddingHorizontal: theme.spacing.md,
			paddingBottom: theme.spacing.sm,
		},
	});
	return styles;
}

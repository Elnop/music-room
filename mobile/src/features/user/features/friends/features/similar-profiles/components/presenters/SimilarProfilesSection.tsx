import React from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { SimilarProfilesSection as Section } from '@/features/user/features/friends/features/similar-profiles/useSimilarProfilesSection';
import { SimilarProfileCard } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfileCard';
import {
	createSimilarProfilesStyles,
	SIMILAR_CARD_WIDTH,
} from '@/features/user/features/friends/features/similar-profiles/components/presenters/similarProfilesStyles';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

interface SimilarProfilesSectionProps {
	section: Section;
}

export function SimilarProfilesSection({ section }: SimilarProfilesSectionProps) {
	const { styles } = useThemedStyles(createSimilarProfilesStyles);

	function body() {
		switch (section.status) {
			case 'loading':
				return null;
			case 'error':
				return (
					<EmptyState
						icon={ExclamationTriangleSolid}
						message="Impossible de charger les suggestions"
						action={{ label: 'Réessayer', onPress: section.retry }}
						compact
					/>
				);
			case 'needsPreferences':
				return (
					<EmptyState
						icon={MusicSolid}
						message="Choisissez vos genres préférés pour découvrir des profils qui vous ressemblent"
						action={{ label: 'Choisir mes genres', onPress: section.openPreferences }}
						compact
					/>
				);
			case 'empty':
				return <Text style={styles.message}>Aucun profil aux goûts proches pour le moment</Text>;
			case 'ready':
				return (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
						decelerationRate="fast"
						snapToInterval={SIMILAR_CARD_WIDTH + 16}
					>
						{section.profiles.map(profile => (
							<SimilarProfileCard key={profile.id} profile={profile} onOpen={section.openProfile} />
						))}
					</ScrollView>
				);
		}
	}

	return (
		<View>
			<SectionHeader
				icon={MusicSolid}
				title="Profils aux goûts proches"
				count={section.profiles.length}
			/>
			{body()}
		</View>
	);
}

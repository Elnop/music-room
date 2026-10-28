import React from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SectionHeader } from '@/shared/components/lists/SectionHeader';
import { Text } from '@/shared/components/ui/Text';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { SimilarProfilesSection as Section } from '@/features/friends/similarProfiles/hooks/useSimilarProfilesSection';
import { SimilarProfileCard } from './SimilarProfileCard';
import { createSimilarProfilesStyles, SIMILAR_CARD_WIDTH } from './similarProfilesStyles';

interface SimilarProfilesSectionProps {
	section: Section;
}

export function SimilarProfilesSection({ section }: SimilarProfilesSectionProps) {
	const { styles } = useThemedStyles(createSimilarProfilesStyles);

	const body = () => {
		switch (section.status) {
			case 'loading':
				return null;
			case 'error':
				return (
					<EmptyState
						icon="cloud-offline-outline"
						message="Impossible de charger les suggestions"
						action={{ label: 'Réessayer', onPress: section.retry }}
						compact
					/>
				);
			case 'needsPreferences':
				return (
					<EmptyState
						icon="musical-notes-outline"
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
	};

	return (
		<View>
			<SectionHeader
				icon="sparkles-outline"
				title="Profils aux goûts proches"
				count={section.profiles.length}
			/>
			{body()}
		</View>
	);
}

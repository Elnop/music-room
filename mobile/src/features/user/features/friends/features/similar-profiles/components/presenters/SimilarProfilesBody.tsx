import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { SimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';
import { SimilarProfilesCarousel } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfilesCarousel';
import { SimilarProfilesNotice } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfilesNotice';

type SimilarProfilesBodyProps = {
	section: SimilarProfilesSection;
};

export function SimilarProfilesBody({ section }: SimilarProfilesBodyProps) {
	const { styles } = useThemedStyles(createStyles);

	switch (section.status) {
		case 'loading':
			return null;
		case 'error':
		case 'needsPreferences':
			return <SimilarProfilesNotice section={section} />;
		case 'empty':
			return <Text style={styles.message}>Aucun profil aux goûts proches pour le moment</Text>;
		case 'ready':
			return <SimilarProfilesCarousel section={section} />;
	}
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		message: {
			paddingHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileSection } from '@/features/user/shared/profile-section/ProfileSection';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type UserProfileWideSectionProps = {
	title: string;
	children: React.ReactNode;
};

export function UserProfileWideSection({ title, children }: UserProfileWideSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<ProfileSection title={title} prominent>
				{children}
			</ProfileSection>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: { marginTop: theme.spacing.md },
	});
	return styles;
}

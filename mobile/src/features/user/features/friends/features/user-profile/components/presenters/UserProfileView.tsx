import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileNarrowBody } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileNarrowBody';
import { UserProfileWideBody } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileWideBody';

type UserProfileViewProps = {
	viewed: ViewedProfile;
	bottomPadding: number;
};

export function UserProfileView({ viewed, bottomPadding }: UserProfileViewProps) {
	const { styles } = useThemedStyles(createStyles);
	const { isWide } = useBreakpoint();

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[styles.contentContainer, bottomPaddingStyle(bottomPadding)]}
		>
			{isWide ? <UserProfileWideBody viewed={viewed} /> : <UserProfileNarrowBody viewed={viewed} />}
		</ScrollView>
	);
}

function bottomPaddingStyle(bottomPadding: number): ViewStyle {
	return { paddingBottom: bottomPadding };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		screen: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		contentContainer: {
			paddingBottom: theme.spacing.xl,
		},
	});
	return styles;
}

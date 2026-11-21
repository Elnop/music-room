import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { ProfileNarrowSections } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileNarrowSections';
import { ProfileUnavailable } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileUnavailable';
import { ProfileWideSections } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileWideSections';
import type {
	ProfileActions,
	ProfileContent,
	ProfileRefresh,
} from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserProfile } from '@/shared/users/userTypes';

type ProfileViewProps = {
	bottomPadding: number;
	user: UserProfile | null;
	content: ProfileContent;
	refresh: ProfileRefresh;
	actions: ProfileActions;
};

export function ProfileView({ bottomPadding, user, content, refresh, actions }: ProfileViewProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { isWide } = useBreakpoint();

	if (!user) return <ProfileUnavailable />;

	const sections = { user, content, actions };

	return (
		<View style={styles.screenWrapper}>
			<ScrollView
				style={styles.profileScroll}
				contentContainerStyle={[styles.contentContainer, bottomPaddingStyle(bottomPadding)]}
				refreshControl={
					<RefreshControl
						refreshing={refresh.isRefreshing}
						onRefresh={refresh.onRefresh}
						tintColor={theme.colors.primary}
					/>
				}
			>
				{isWide ? <ProfileWideSections {...sections} /> : <ProfileNarrowSections {...sections} />}
			</ScrollView>
		</View>
	);
}

function bottomPaddingStyle(bottomPadding: number): ViewStyle {
	return { paddingBottom: bottomPadding };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		screenWrapper: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		profileScroll: {
			flex: 1,
		},
		contentContainer: {
			paddingBottom: theme.spacing.xl,
		},
	});
	return styles;
}

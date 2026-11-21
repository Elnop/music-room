import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ViewedProfile } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { UserProfileBio } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileBio';
import { UserProfileGenreChips } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileGenreChips';
import { UserProfileNames } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileNames';
import { UserProfileTopRow } from '@/features/user/features/friends/features/user-profile/components/presenters/UserProfileTopRow';

type UserProfileInfoProps = {
	viewed: ViewedProfile;
};

export function UserProfileInfo({ viewed }: UserProfileInfoProps) {
	const { styles } = useThemedStyles(createStyles);
	const { profile } = viewed;
	const genres = profile.musicPreferences || [];

	return (
		<>
			<UserProfileTopRow profile={profile} followStatus={viewed.follow.status} />
			<UserProfileNames viewed={viewed} />
			<UserProfileBio profile={profile} isFriend={viewed.follow.status?.isFriend ?? false} />
			{genres.length > 0 && <UserProfileGenreChips genres={genres} style={styles.genresInline} />}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		genresInline: {
			marginTop: theme.spacing.md,
		},
	});
	return styles;
}

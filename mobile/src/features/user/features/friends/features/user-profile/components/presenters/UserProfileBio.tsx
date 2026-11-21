import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { FilteredProfile } from '@/features/user/features/friends/friendsTypes';
import { HiddenFieldNote } from '@/features/user/features/friends/features/user-profile/components/presenters/HiddenFieldNote';

type UserProfileBioProps = {
	profile: FilteredProfile;
	isFriend: boolean;
};

export function UserProfileBio({ profile, isFriend }: UserProfileBioProps) {
	const { styles } = useThemedStyles(createStyles);

	if (profile.bio === undefined) {
		return <HiddenFieldNote label={isFriend ? 'Bio privée' : 'Visible uniquement par ses amis'} />;
	}
	if (!profile.bio) return null;
	return <Text style={styles.bio}>{profile.bio}</Text>;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		bio: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.text,
			marginTop: theme.spacing.sm,
			lineHeight: theme.typography.lineHeights.sm,
		},
	});
	return styles;
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileBuildLabel } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileBuildLabel';
import { ProfileInfoSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileInfoSection';
import { ProfileMenuItems } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileMenuItems';
import { ProfilePreferencesSection } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfilePreferencesSection';
import { ProfileWideHeader } from '@/features/user/features/profile/features/profile-screen/components/presenters/ProfileWideHeader';
import type {
	ProfileActions,
	ProfileContent,
} from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserProfile } from '@/shared/users/userTypes';

type ProfileWideSectionsProps = {
	user: UserProfile;
	content: ProfileContent;
	actions: ProfileActions;
};

export function ProfileWideSections({ user, content, actions }: ProfileWideSectionsProps) {
	const { styles } = useThemedStyles(createStyles);
	const column = useContentColumn();

	return (
		<View style={column}>
			<ProfileWideHeader user={user} stats={content.stats} actions={actions} />
			<View style={styles.wideSection}>
				<ProfilePreferencesSection
					genres={content.genres}
					onModify={actions.onMusicPreferences}
					prominent
				/>
			</View>
			<View style={styles.wideSection}>
				<ProfileInfoSection user={user} prominent />
			</View>
			<Text style={styles.wideHeading}>Compte</Text>
			<ProfileMenuItems wide actions={actions} />
			<ProfileBuildLabel label={content.buildLabel} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		wideSection: { marginTop: theme.spacing.md },
		wideHeading: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
			marginHorizontal: theme.spacing.lg,
			marginTop: theme.spacing.lg,
		},
	});
	return styles;
}

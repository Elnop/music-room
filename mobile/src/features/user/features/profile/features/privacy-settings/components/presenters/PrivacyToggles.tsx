import React from 'react';
import { StyleSheet, View } from 'react-native';
import { VisibilityToggle } from '@/features/user/features/profile/features/privacy-settings/components/presenters/VisibilityToggle';
import type { PrivacyEditing } from '@/features/user/features/profile/features/privacy-settings/privacySettingsTypes';
import { PRIVACY_TOGGLES } from '@/features/user/features/profile/features/privacy-settings/privacyTogglesConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ProfilePrivacy } from '@/shared/users/userTypes';

type PrivacyTogglesProps = {
	privacy: ProfilePrivacy;
	onVisibilityChange: PrivacyEditing['onVisibilityChange'];
};

export function PrivacyToggles({ privacy, onVisibilityChange }: PrivacyTogglesProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.settings}>
			{PRIVACY_TOGGLES.map(toggle => (
				<VisibilityToggle
					key={toggle.field}
					label={toggle.label}
					description={toggle.description}
					value={privacy[toggle.field]}
					onChange={value => onVisibilityChange(toggle.field, value)}
				/>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		settings: {
			marginBottom: theme.spacing.xl,
		},
	});
	return styles;
}

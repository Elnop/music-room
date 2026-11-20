import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ProfileScreenFrame } from '@/features/profile/common/presenters/ProfileScreenFrame';
import { VisibilityToggle } from '@/features/profile/common/presenters/VisibilityToggle';
import { Button } from '@/shared/theme/components/Button';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import type { ProfilePrivacy, VisibilityLevel } from '@/shared/users/user.types';

interface PrivacySettingsViewProps {
	theme: Theme;
	bottomPadding: number;
	isLoading: boolean;
	isSaving: boolean;
	privacy: ProfilePrivacy | null;
	hasChanges: boolean;
	onVisibilityChange: (field: keyof ProfilePrivacy, value: VisibilityLevel) => void;
	onSave: () => void;
}

export function PrivacySettingsView({
	bottomPadding,
	isLoading,
	isSaving,
	privacy,
	hasChanges,
	onVisibilityChange,
	onSave,
}: PrivacySettingsViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<ProfileScreenFrame
			subtitle="Choisissez qui peut voir vos informations"
			bottomPadding={bottomPadding}
			isLoading={isLoading}
			errorMessage={!privacy ? 'Impossible de charger les paramètres' : null}
		>
			{privacy && (
				<>
					<View style={styles.settings}>
						<VisibilityToggle
							label="Photo de profil"
							description="Qui peut voir votre photo"
							value={privacy.avatarVisibility}
							onChange={value => onVisibilityChange('avatarVisibility', value)}
						/>

						<VisibilityToggle
							label="Adresse email"
							description="Qui peut voir votre email"
							value={privacy.emailVisibility}
							onChange={value => onVisibilityChange('emailVisibility', value)}
						/>

						<VisibilityToggle
							label="Bio"
							description="Qui peut voir votre bio"
							value={privacy.bioVisibility}
							onChange={value => onVisibilityChange('bioVisibility', value)}
						/>

						<VisibilityToggle
							label="Préférences musicales"
							description="Qui peut voir vos genres préférés"
							value={privacy.musicPreferencesVisibility}
							onChange={value => onVisibilityChange('musicPreferencesVisibility', value)}
						/>
					</View>
					<Button
						variant="primary"
						onPress={onSave}
						loading={isSaving}
						disabled={!hasChanges || isSaving}
					>
						Enregistrer
					</Button>
				</>
			)}
		</ProfileScreenFrame>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		settings: {
			marginBottom: theme.spacing.xl,
		},
	});

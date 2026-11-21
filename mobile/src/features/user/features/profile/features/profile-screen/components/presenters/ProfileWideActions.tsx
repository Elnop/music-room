import React from 'react';
import { StyleSheet } from 'react-native';
import type { ProfileActions } from '@/features/user/features/profile/features/profile-screen/profileScreenTypes';
import { Button } from '@/shared/theme/components/Button';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import CogSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cog-solid.svg';
import PencilSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pencil-solid.svg';

type ProfileWideActionsProps = {
	actions: ProfileActions;
};

export function ProfileWideActions({ actions }: ProfileWideActionsProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<>
			<Button
				variant="secondary"
				onPress={actions.onEditProfile}
				style={styles.action}
				icon={<PixelIcon icon={PencilSolid} size={18} color={theme.colors.text} />}
				title="Modifier le profil"
			/>
			<Button
				variant="secondary"
				onPress={actions.onSettings}
				style={styles.action}
				icon={<PixelIcon icon={CogSolid} size={18} color={theme.colors.text} />}
				title="Réglages"
			/>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		action: {
			height: theme.controls.iconButtonXl,
			paddingHorizontal: theme.spacing.md,
		},
	});
	return styles;
}

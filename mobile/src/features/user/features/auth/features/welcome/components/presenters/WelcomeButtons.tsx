import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { ServerToggle } from '@/features/user/features/auth/features/welcome/components/presenters/ServerToggle';
import type {
	ServerSettings,
	WelcomeActions,
} from '@/features/user/features/auth/features/welcome/welcomeTypes';

type WelcomeButtonsProps = {
	actions: WelcomeActions;
	server: ServerSettings;
};

export function WelcomeButtons({ actions, server }: WelcomeButtonsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.buttonContainer}>
			<Button title="Commencer" onPress={actions.onStart} variant="primary" fullWidth />
			<Button title="Se connecter" onPress={actions.onLogin} variant="outline" fullWidth />
			<ServerToggle server={server} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		buttonContainer: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.form - 2 * theme.spacing.lg,
			alignSelf: 'center',
			gap: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
	});
	return styles;
}

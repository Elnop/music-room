import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LANDING_SHOWN } from '@/shared/platform/platformConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { FloatingIcon } from '@/features/user/features/auth/features/welcome/components/presenters/FloatingIcon';
import { WelcomeHero } from '@/features/user/features/auth/features/welcome/components/presenters/WelcomeHero';
import { WelcomeFooter } from '@/features/user/features/auth/features/welcome/components/presenters/WelcomeFooter';
import { LandingSections } from '@/features/user/features/auth/features/welcome/components/presenters/LandingSections';
import type {
	FloatingIconMotion,
	ServerSettings,
	WelcomeActions,
} from '@/features/user/features/auth/features/welcome/welcomeTypes';

type WelcomeViewProps = {
	icons: FloatingIconMotion[];
	buildLabel: string;
	server: ServerSettings;
	actions: WelcomeActions;
};

export function WelcomeView({ icons, buildLabel, server, actions }: WelcomeViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<SafeAreaView style={styles.container}>
			{icons.map(icon => (
				<FloatingIcon key={icon.spec.id} motion={icon} />
			))}
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
					<WelcomeHero actions={actions} server={server} />
					{LANDING_SHOWN ? (
						<LandingSections buildLabel={buildLabel} actions={actions} />
					) : (
						<WelcomeFooter buildLabel={buildLabel} actions={actions} />
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		flex: {
			flex: 1,
		},
		content: {
			flexGrow: 1,
			justifyContent: 'space-between',
			padding: theme.spacing.lg,
		},
	});
	return styles;
}

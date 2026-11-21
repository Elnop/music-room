import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { LANDING_SHOWN } from '@/shared/platform/platformConfig';
import { WelcomeHeader } from '@/features/user/features/auth/features/welcome/components/presenters/WelcomeHeader';
import { WelcomeButtons } from '@/features/user/features/auth/features/welcome/components/presenters/WelcomeButtons';
import type {
	ServerSettings,
	WelcomeActions,
} from '@/features/user/features/auth/features/welcome/welcomeTypes';

const LANDING_PEEK = 96;

type WelcomeHeroProps = {
	actions: WelcomeActions;
	server: ServerSettings;
};

function heightStyle(windowHeight: number): ViewStyle | undefined {
	return LANDING_SHOWN ? { minHeight: windowHeight - LANDING_PEEK } : undefined;
}

export function WelcomeHero({ actions, server }: WelcomeHeroProps) {
	const { height } = useWindowDimensions();

	return (
		<View style={[styles.hero, heightStyle(height)]}>
			<WelcomeHeader />
			<WelcomeButtons actions={actions} server={server} />
		</View>
	);
}

const styles = StyleSheet.create({
	hero: {
		flex: 1,
	},
});

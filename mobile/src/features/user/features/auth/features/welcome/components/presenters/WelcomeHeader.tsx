import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelWordmark } from '@/shared/theme/components/PixelWordmark';
import { Text } from '@/shared/theme/components/Text';
import { LANDING_SHOWN } from '@/shared/platform/platformConfig';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { LANDING_INTRO } from '@/features/user/features/auth/features/welcome/landingContent';

export function WelcomeHeader() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.header}>
			<PixelWordmark size={48} />
			{LANDING_SHOWN && <Text style={styles.intro}>{LANDING_INTRO}</Text>}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			gap: theme.spacing.xl,
		},
		intro: {
			maxWidth: CONTENT_MAX_WIDTH.form,
			marginBottom: theme.spacing.xl,
			fontSize: theme.typography.sizes.lg,
			lineHeight: theme.typography.lineHeights.lg,
			color: theme.colors.text,
			textAlign: 'center',
		},
	});
	return styles;
}

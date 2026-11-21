import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { Text } from '@/shared/theme/components/Text';
import { LATEST_RELEASE_URL } from '@/shared/project-links/projectLinksConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { LandingTitle } from '@/features/user/features/auth/features/welcome/components/presenters/LandingTitle';

type DownloadSectionProps = {
	onOpenLink: (url: string) => void;
};

export function DownloadSection({ onOpenLink }: DownloadSectionProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<View style={styles.panel}>
				<LandingTitle title="Télécharger" />
				<Text style={styles.body}>
					L'application Android est disponible dans la dernière version publiée sur GitHub.
				</Text>
				<Button
					title="Télécharger pour Android"
					variant="outline"
					onPress={() => onOpenLink(LATEST_RELEASE_URL)}
				/>
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: {
			gap: theme.spacing.md,
		},
		panel: {
			gap: theme.spacing.md,
			padding: theme.spacing.lg,
			backgroundColor: theme.colors.surface,
		},
		body: {
			fontSize: theme.typography.sizes.md,
			lineHeight: theme.typography.lineHeights.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

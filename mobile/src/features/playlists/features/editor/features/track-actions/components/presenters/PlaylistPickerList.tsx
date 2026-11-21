import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { Text } from '@/shared/theme/components/Text';
import type { TrackActions } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';
import { PlaylistPickerRows } from '@/features/playlists/features/editor/features/track-actions/components/presenters/PlaylistPickerRows';

type PlaylistPickerListProps = {
	actions: TrackActions;
};

export function PlaylistPickerList({ actions }: PlaylistPickerListProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (actions.loadingPlaylists) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator testID="track-actions-loading" color={theme.colors.primary} />
			</View>
		);
	}
	if (actions.editable.length === 0) {
		return <Text style={styles.emptyText}>Aucune playlist modifiable</Text>;
	}
	return <PlaylistPickerRows actions={actions} />;
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		centered: {
			padding: theme.spacing.xl,
			alignItems: 'center',
		},
		emptyText: {
			padding: theme.spacing.xl,
			textAlign: 'center',
			fontSize: theme.typography.sizes.mlg,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}

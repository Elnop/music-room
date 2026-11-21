import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { PlaylistForm } from '@/features/playlists/features/editor/features/playlist-form/playlistFormTypes';
import { PlaylistFormFields } from '@/features/playlists/features/editor/features/playlist-form/components/presenters/PlaylistFormFields';

type PlaylistFormViewProps = {
	form: PlaylistForm;
	bottomPadding: number;
};

export function PlaylistFormView({ form, bottomPadding }: PlaylistFormViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme, bottomPadding), [theme, bottomPadding]);

	return (
		<View style={styles.screen}>
			<KeyboardAvoidingView
				style={styles.keyboard}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
					<View style={styles.body}>
						<PlaylistFormFields form={form} />
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</View>
	);
}

function createStyles(theme: Theme, bottomPadding: number) {
	const styles = StyleSheet.create({
		screen: { flex: 1, backgroundColor: theme.colors.background },
		keyboard: { flex: 1 },
		scroll: { flexGrow: 1, paddingTop: theme.spacing.md, paddingBottom: bottomPadding },
		body: { flex: 1, padding: theme.spacing.lg },
	});
	return styles;
}

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SharingBody } from '@/features/playlists/features/editor/features/sharing/components/presenters/SharingBody';
import { SharingHeader } from '@/features/playlists/features/editor/features/sharing/components/presenters/SharingHeader';
import type { PlaylistSharing } from '@/features/playlists/features/editor/features/sharing/sharingTypes';

type SharingViewProps = {
	sharing: PlaylistSharing;
};

export function SharingView({ sharing }: SharingViewProps) {
	const { theme } = useTheme();
	const { bottomPadding } = sharing;
	const styles = React.useMemo(() => createStyles(theme, bottomPadding), [theme, bottomPadding]);

	if (sharing.members.isLoading) return <LoadingSpinner fullScreen message="Chargement…" />;

	return (
		<View style={styles.container}>
			<ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
				<SharingHeader mode={sharing.mode} />
				<SharingBody sharing={sharing} />
			</ScrollView>
		</View>
	);
}

function createStyles(theme: Theme, bottomPadding: number) {
	const styles = StyleSheet.create({
		container: { flex: 1, backgroundColor: theme.colors.background },
		scroll: { flexGrow: 1, paddingBottom: bottomPadding },
	});
	return styles;
}

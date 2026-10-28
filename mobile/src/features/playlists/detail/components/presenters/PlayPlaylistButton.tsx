import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlayPlaylist } from '@/features/playlists/detail/hooks/usePlayPlaylist';

const BUTTON_SIZE = 44;

/** In the header, so it scrolls with the list and never covers a row. */
export function PlayPlaylistButton({ play }: { play: PlayPlaylist }) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.button}
			onPress={play.press}
			disabled={play.loading}
			accessibilityLabel={play.playing ? 'Mettre la playlist en pause' : 'Lire la playlist'}
			accessibilityState={{ busy: play.loading, disabled: play.loading }}
		>
			{play.loading ? (
				<ActivityIndicator color={theme.colors.textInverse} />
			) : (
				<Ionicons
					name={play.playing ? 'pause' : 'play'}
					size={22}
					color={theme.colors.textInverse}
					style={play.playing ? undefined : styles.playIcon}
				/>
			)}
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		button: {
			width: BUTTON_SIZE,
			height: BUTTON_SIZE,
			backgroundColor: theme.colors.primary,
			justifyContent: 'center',
			alignItems: 'center',
		},
		// The play glyph looks off-centre to the left in a circle.
		playIcon: {
			marginLeft: 2,
		},
	});

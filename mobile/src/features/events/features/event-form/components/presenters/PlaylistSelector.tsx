import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistChoice } from '@/features/events/eventTypes';
import { FieldLabel } from '@/features/events/features/event-form/components/presenters/FieldLabel';
import { PlaylistOption } from '@/features/events/features/event-form/components/presenters/PlaylistOption';
import { Text } from '@/shared/theme/components/Text';

type PlaylistSelectorProps = {
	playlists: PlaylistChoice[];
	selectedId: string | null;
	onSelect: (id: string | null) => void;
};

export function PlaylistSelector({ playlists, selectedId, onSelect }: PlaylistSelectorProps) {
	const { styles } = useThemedStyles(createStyles);
	const options = [{ id: null, name: 'Aucune' }, ...playlists];

	return (
		<View>
			<FieldLabel label="Playlist liée (facultative)" />
			{playlists.length === 0 && (
				<Text style={styles.hint}>Seules vos playlists publiques peuvent être liées.</Text>
			)}
			<View style={styles.list}>
				{options.map(option => (
					<PlaylistOption
						key={option.id ?? 'none'}
						name={option.name}
						selected={option.id === selectedId}
						onSelect={() => onSelect(option.id)}
					/>
				))}
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		hint: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginBottom: theme.spacing.sm,
		},
		list: { gap: theme.spacing.xs },
	});
	return styles;
}

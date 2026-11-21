import React from 'react';
import { StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { MembersList } from '@/features/playlists/features/editor/features/sharing/components/presenters/MembersList';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistMember } from '@/features/playlists/shared/playlist/playlistTypes';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/createSharingStyles';
import { Text } from '@/shared/theme/components/Text';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

type MembersSectionProps = {
	title: string;
	members: PlaylistMember[];
	emptyMessage: string | null;
	onRemove: (userId: string) => Promise<void>;
};

export function MembersSection({ title, members, emptyMessage, onRemove }: MembersSectionProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<Text style={shared.sectionTitle}>{title}</Text>
			{members.length > 0 ? (
				<MembersList members={members} onRemove={onRemove} />
			) : (
				emptyMessage && <EmptyState icon={UsersSolid} style={styles.empty} message={emptyMessage} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		section: {
			flex: 1,
		},
		empty: {
			flex: 0,
			padding: theme.spacing.lg,
		},
	});
	return styles;
}

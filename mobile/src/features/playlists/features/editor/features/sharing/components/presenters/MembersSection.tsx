import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SwipeableUserItem } from '@/features/playlists/features/editor/features/sharing/components/presenters/SwipeableUserItem';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistMember } from '@/features/playlists/shared/playlist/lib/types';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/sharingStyles';
import { Text } from '@/shared/theme/components/Text';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

interface MembersSectionProps {
	title: string;
	members: PlaylistMember[];
	emptyMessage: string | null;
	onRemove: (userId: string) => Promise<void>;
}

export function MembersSection({ title, members, emptyMessage, onRemove }: MembersSectionProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.section}>
			<Text style={shared.sectionTitle}>{title}</Text>
			{members.length > 0 ? (
				<FlatList
					data={members}
					keyExtractor={item => item.id}
					style={styles.section}
					scrollEnabled={false}
					renderItem={({ item }) => (
						<SwipeableUserItem
							user={{
								id: item.id,
								username: item.username,
								display_name: item.displayName,
								avatar_url: item.avatarUrl,
							}}
							role={item.canEdit ? 'collaborator' : 'viewer'}
							onRemove={onRemove}
						/>
					)}
				/>
			) : (
				emptyMessage && <EmptyState icon={UsersSolid} style={styles.empty} message={emptyMessage} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		section: {
			flex: 1,
		},
		empty: {
			flex: 0,
			padding: theme.spacing.lg,
		},
	});
}

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SwipeableUserItem } from '@/shared/components/lists/SwipeableUserItem';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlaylistMember } from '@/features/playlists/types';
import { createSharingStyles } from './sharingStyles';
import { Text } from '@/shared/components/ui/Text';

interface MembersSectionProps {
	title: string;
	members: PlaylistMember[];
	/** Shown when nobody is there yet; none on an open public playlist. */
	emptyMessage: string | null;
	/** Swipe to remove, without confirmation. */
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
				emptyMessage && (
					<EmptyState icon="people-outline" style={styles.empty} message={emptyMessage} />
				)
			)}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		section: {
			flex: 1,
		},
		empty: {
			flex: 0,
			padding: theme.spacing.lg,
		},
	});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Avatar } from '@/shared/theme/components/Avatar';
import { UserIdentity } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserIdentity';
import { UserRemoveAction } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserRemoveAction';
import { UserRoleBadge } from '@/features/playlists/features/editor/features/sharing/components/presenters/UserRoleBadge';

type SwipeableUserItemProps = {
	user: {
		id: string;
		username: string;
		display_name?: string | null;
		avatar_url?: string | null;
	};
	role: 'collaborator' | 'viewer';
	onRemove: (userId: string) => Promise<void>;
};

export function SwipeableUserItem({ user, role, onRemove }: SwipeableUserItemProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);

	function renderRightActions() {
		return <UserRemoveAction onRemove={() => onRemove(user.id)} />;
	}

	return (
		<Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2}>
			<View style={styles.userContainer}>
				<Avatar
					uri={user.avatar_url || undefined}
					size="md"
					name={user.username}
					style={styles.avatar}
				/>
				<UserIdentity username={user.username} displayName={user.display_name} />
				<UserRoleBadge role={role} />
			</View>
		</Swipeable>
	);
}

function createStyles(theme: Theme, separator: string) {
	const styles = StyleSheet.create({
		userContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: theme.spacing.smd,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: theme.borders.hairline,
			borderBottomColor: separator,
		},
		avatar: {
			marginRight: theme.spacing.smd,
		},
	});
	return styles;
}

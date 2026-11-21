import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Pressable } from '@/shared/theme/components/Pressable';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { createSharingStyles } from '@/features/playlists/features/editor/features/sharing/components/presenters/createSharingStyles';
import { Text } from '@/shared/theme/components/Text';
import PlusSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/plus-solid.svg';

type UserResultRowProps = {
	user: UserSummary;
	busy: boolean;
	onAdd: (user: UserSummary) => void;
};

export function UserResultRow({ user, busy, onAdd }: UserResultRowProps) {
	const { styles: shared } = useThemedStyles(createSharingStyles);
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={[shared.card, shared.row]}
			onPress={() => onAdd(user)}
			disabled={busy}
			accessibilityLabel={`Ajouter ${user.username}`}
		>
			<Avatar size="md" name={user.displayName || user.username} uri={user.avatarUrl} />
			<View style={styles.info}>
				<Text style={styles.username}>{user.username}</Text>
				{user.displayName && <Text style={styles.displayName}>{user.displayName}</Text>}
			</View>
			<View style={styles.addButton}>
				<PixelIcon icon={PlusSolid} size={24} color={theme.colors.onColor} />
			</View>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		info: { flex: 1, marginLeft: theme.spacing.md },
		username: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.xxs,
		},
		addButton: {
			width: theme.controls.rowIcon,
			height: theme.controls.rowIcon,
			backgroundColor: theme.colors.primary,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}

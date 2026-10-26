import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar } from '@/shared/components/media/Avatar';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useSession } from '@/shared/services/authSession';
import { useSeparatorColor } from '@/shared/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Text } from '@/shared/components/ui/Text';

interface SidebarAccountProps {
	onPress: () => void;
}

/** The signed-in user at the foot of the desktop side bar, a link to the profile. */
export function SidebarAccount({ onPress }: SidebarAccountProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);
	const user = useSession(s => s.user);
	if (!user) return null;
	const name = user.displayName || user.username;

	return (
		<Pressable
			style={styles.container}
			onPress={onPress}
			accessibilityRole="link"
			accessibilityLabel={`Profil, ${name}`}
		>
			<Avatar size="sm" name={name} uri={user.avatarUrl} />
			<View style={styles.info}>
				<Text style={styles.name} numberOfLines={1}>
					{name}
				</Text>
				<Text style={styles.username} numberOfLines={1}>
					@{user.username}
				</Text>
			</View>
		</Pressable>
	);
}

const createStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			marginHorizontal: theme.spacing.sm,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.md,
			borderTopWidth: 1,
			borderTopColor: separator,
		},
		info: {
			flex: 1,
			minWidth: 0,
		},
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		username: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { Avatar } from '@/shared/components/media/Avatar';

interface SwipeableUserItemProps {
	user: {
		id: string;
		username: string;
		display_name?: string | null;
		avatar_url?: string | null;
	};
	role: 'collaborator' | 'viewer';
	onRemove: (userId: string) => Promise<void>;
}

export function SwipeableUserItem({ user, role, onRemove }: SwipeableUserItemProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const renderRightActions = () => {
		return (
			<Pressable
				style={styles.removeButton}
				onPress={() => onRemove(user.id)}
				accessibilityLabel="Retirer"
			>
				<Ionicons name="person-remove-outline" size={24} color={theme.colors.onColor} />
				<Text style={styles.removeText}>Retirer</Text>
			</Pressable>
		);
	};

	return (
		<Swipeable renderRightActions={renderRightActions} overshootRight={false} friction={2}>
			<View style={styles.userContainer}>
				<Avatar
					uri={user.avatar_url || undefined}
					size="md"
					name={user.username}
					style={styles.avatar}
				/>

				<View style={styles.userInfo}>
					<Text style={styles.displayName} numberOfLines={1}>
						{user.display_name || user.username}
					</Text>
					<Text style={styles.username} numberOfLines={1}>
						@{user.username}
					</Text>
				</View>

				<View style={[styles.roleBadge, styles[`roleBadge_${role}`]]}>
					<Text style={styles.roleText}>
						{role === 'collaborator' ? 'Collaborateur' : 'Lecteur'}
					</Text>
				</View>
			</View>
		</Swipeable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		userContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			padding: 12,
			backgroundColor: theme.colors.surface,
			borderBottomWidth: 1,
			borderBottomColor: theme.colors.border,
		},
		avatar: {
			marginRight: 12,
		},
		userInfo: {
			flex: 1,
			marginRight: 8,
		},
		displayName: {
			fontSize: 15,
			fontWeight: '600',
			color: theme.colors.text,
			marginBottom: 2,
		},
		username: {
			fontSize: 13,
			color: theme.colors.textSecondary,
		},
		roleBadge: {
			paddingHorizontal: 10,
			paddingVertical: 4,
			borderRadius: 12,
		},
		roleBadge_collaborator: {
			backgroundColor: theme.colors.primary + '30',
		},
		roleBadge_viewer: {
			backgroundColor: theme.colors.border,
		},
		roleText: {
			fontSize: 11,
			fontWeight: '600',
			color: theme.colors.text,
		},
		removeButton: {
			backgroundColor: theme.colors.error,
			justifyContent: 'center',
			alignItems: 'center',
			width: 100,
			height: '100%',
		},
		removeText: {
			color: theme.colors.onColor,
			fontSize: 12,
			fontWeight: '600',
			marginTop: 4,
		},
	});

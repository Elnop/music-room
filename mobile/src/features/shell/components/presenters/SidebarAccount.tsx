import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Avatar } from '@/shared/theme/components/Avatar';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { SidebarAccountName } from '@/features/shell/components/presenters/SidebarAccountName';

type SidebarAccountInfo = {
	name: string;
	username: string;
	avatarUrl?: string;
};

type SidebarAccountProps = {
	account: SidebarAccountInfo;
	active: boolean;
	onPress: () => void;
};

export function SidebarAccount({ account, active, onPress }: SidebarAccountProps) {
	const { styles } = useThemedStyles(createStyles);
	const separator = useSeparatorColor();

	return (
		<View style={[styles.container, separatorStyle(separator)]}>
			<Pressable
				style={[styles.account, active && styles.active]}
				onPress={onPress}
				accessibilityRole="button"
				accessibilityLabel={`Profil, ${account.name}`}
				accessibilityState={{ selected: active }}
			>
				<Avatar size="sm" name={account.name} uri={account.avatarUrl} />
				<SidebarAccountName name={account.name} username={account.username} />
			</Pressable>
		</View>
	);
}

function separatorStyle(borderTopColor: string): ViewStyle {
	return { borderTopColor };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			marginHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
			borderTopWidth: theme.borders.hairline,
		},
		account: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
		},
		active: {
			backgroundColor: theme.colors.surfaceAlt,
		},
	});
	return styles;
}

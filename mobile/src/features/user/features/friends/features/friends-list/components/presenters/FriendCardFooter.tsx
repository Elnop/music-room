import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendControl } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { ControlSwitch } from '@/features/user/features/friends/features/friends-list/components/presenters/ControlSwitch';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

const CONTROL_LABEL = 'Peut contrôler ma musique sur tous mes appareils';

type FriendCardFooterProps = {
	friendId: string;
	name: string;
	control: FriendControl;
};

export function FriendCardFooter({ friendId, name, control }: FriendCardFooterProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const canControl = control.canControl(friendId);

	return (
		<View style={styles.cardFooter}>
			<PixelIcon
				icon={MusicSolid}
				size={14}
				color={canControl ? theme.colors.primary : theme.colors.textSecondary}
			/>
			<Text style={[styles.cardFooterText, canControl && styles.controlTextActive]}>
				{CONTROL_LABEL}
			</Text>
			<ControlSwitch
				friendId={friendId}
				control={control}
				accessibilityLabel={`${name} ${CONTROL_LABEL.toLowerCase()}`}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		cardFooter: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.sm,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.sm,
			paddingHorizontal: theme.spacing.md,
		},
		cardFooterText: {
			flex: 1,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		controlTextActive: {
			color: theme.colors.primary,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}

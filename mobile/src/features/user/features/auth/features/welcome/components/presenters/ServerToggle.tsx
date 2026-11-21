import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ServerSettings } from '@/features/user/features/auth/features/welcome/welcomeTypes';
import CogSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/cog-solid.svg';

type ServerToggleProps = {
	server: ServerSettings;
};

const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

export function ServerToggle({ server }: ServerToggleProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<>
			<Pressable
				onPress={server.onToggle}
				accessibilityLabel="Serveur"
				accessibilityState={{ expanded: server.shown }}
				hitSlop={HIT_SLOP}
				style={styles.serverToggle}
			>
				<PixelIcon
					icon={CogSolid}
					size={20}
					color={server.shown ? theme.colors.primary : theme.colors.textSecondary}
				/>
			</Pressable>
			{server.shown && <View style={styles.serverPanel}>{server.field}</View>}
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		serverToggle: {
			alignSelf: 'center',
			padding: theme.spacing.xs,
		},
		serverPanel: {
			padding: theme.spacing.md,
			backgroundColor: theme.colors.surface,
			borderWidth: theme.borders.thin,
			borderColor: theme.colors.border,
		},
	});
	return styles;
}

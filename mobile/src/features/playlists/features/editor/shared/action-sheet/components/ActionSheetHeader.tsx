import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { TitleLines } from '@/shared/theme/components/TitleLines';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ActionSheetHeading } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import AngleLeftSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/angle-left-solid.svg';

type ActionSheetHeaderProps = {
	heading: ActionSheetHeading;
};

export function ActionSheetHeader({ heading }: ActionSheetHeaderProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);

	return (
		<View style={styles.header}>
			{heading.onBack && (
				<Pressable onPress={heading.onBack} style={styles.backButton} accessibilityLabel="Retour">
					<PixelIcon icon={AngleLeftSolid} size={22} color={theme.colors.text} />
				</Pressable>
			)}
			<TitleLines title={heading.title} subtitle={heading.subtitle} size="large" singleLine />
		</View>
	);
}

function createStyles(theme: Theme, separator: string) {
	const styles = StyleSheet.create({
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.lg,
			paddingVertical: theme.spacing.md,
			borderBottomWidth: theme.borders.hairline,
			borderBottomColor: separator,
		},
		backButton: {
			marginRight: theme.spacing.sm,
			padding: theme.spacing.xs,
		},
	});
	return styles;
}

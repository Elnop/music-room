import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useShareLink } from '@/shared/theme/hooks/useShareLink';
import { userLink } from '@/shared/share-links/shareLinks';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import ShareSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/share-solid.svg';

type WideShareButtonProps = {
	userId: string;
	name: string;
};

export function WideShareButton({ userId, name }: WideShareButtonProps) {
	const { theme, styles } = useThemedStyles(createStyles);
	const share = useShareLink(userLink(userId), name);

	return (
		<Button
			variant="secondary"
			onPress={share}
			style={styles.action}
			icon={<PixelIcon icon={ShareSolid} size={18} color={theme.colors.text} />}
			title="Partager"
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		action: {
			height: theme.controls.iconButtonXl,
			paddingHorizontal: theme.spacing.md,
		},
	});
	return styles;
}

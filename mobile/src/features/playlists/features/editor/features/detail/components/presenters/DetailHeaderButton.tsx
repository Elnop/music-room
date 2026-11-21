import React from 'react';
import type { Ref } from 'react';
import { StyleSheet, View } from 'react-native';
import { HeaderIconButton } from '@/features/playlists/shared/header-button/HeaderIconButton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import EllipsesHorizontalSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/ellipses-horizontal-solid.svg';

type DetailHeaderButtonProps = {
	visible: boolean;
	buttonRef: Ref<View>;
	onPress: () => void;
};

export function DetailHeaderButton({ visible, buttonRef, onPress }: DetailHeaderButtonProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.slot}>
			{visible ? (
				<HeaderIconButton
					ref={buttonRef}
					icon={EllipsesHorizontalSolid}
					size={24}
					onPress={onPress}
					accessibilityLabel="Options de la playlist"
				/>
			) : null}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		slot: {
			width: theme.controls.headerButton,
			height: theme.controls.headerButton,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}

import { StyleSheet } from 'react-native';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';

type DetailInsets = {
	top: number;
	bottom: number;
};

export function createDetailStyles(theme: Theme, insets: DetailInsets) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: insets.top + theme.controls.transparentHeader,
			paddingBottom: insets.bottom,
		},
		column: {
			width: '100%',
			maxWidth: CONTENT_MAX_WIDTH.content,
			alignSelf: 'center',
		},
	});
	return styles;
}

import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ColorValue, ViewStyle } from 'react-native';
import { getHeaderTitle, Header } from '@react-navigation/elements';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { CONTENT_MAX_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { SCREEN_WIDTHS } from '@/features/shell/configs/screenWidthsConfig';
import { headerLeftFor } from '@/features/shell/lib/headerLeftFor';
import { headerOptions } from '@/features/shell/lib/headerOptions';

export function AlignedHeader({ options, back, route, navigation }: NativeStackHeaderProps) {
	const column = SCREEN_WIDTHS[route.name];
	const background = StyleSheet.flatten(options.headerStyle)?.backgroundColor;

	return (
		<View style={[styles.row, backgroundStyle(background)]}>
			<View style={[styles.column, column && maxWidthStyle(CONTENT_MAX_WIDTH[column])]}>
				<Header
					{...headerOptions(options)}
					back={back}
					title={getHeaderTitle(options, route.name)}
					headerLeft={headerLeftFor(options, back, navigation.goBack)}
				/>
			</View>
		</View>
	);
}

function backgroundStyle(backgroundColor: ColorValue | undefined): ViewStyle {
	return { backgroundColor };
}

function maxWidthStyle(maxWidth: number): ViewStyle {
	return { maxWidth };
}

const styles = StyleSheet.create({
	row: { alignItems: 'center' },
	column: { width: '100%' },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { getHeaderTitle, Header, HeaderBackButton } from '@react-navigation/elements';
import type { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { CONTENT_MAX_WIDTH } from '@/shared/constants/layout';
import { SCREEN_WIDTHS } from '@/navigation/screenWidths';

/** The native stack's web header, laid out in the screen's column so its buttons line up with the content. */
export function AlignedHeader({ options, back, route, navigation }: NativeStackHeaderProps) {
	const column = SCREEN_WIDTHS[route.name];
	const {
		header: _header,
		headerShown: _headerShown,
		headerBackIcon: _headerBackIcon,
		headerBackImageSource: _headerBackImageSource,
		presentation: _presentation,
		contentStyle: _contentStyle,
		headerLeft,
		headerBackTitle,
		...rest
	} = options;

	return (
		<View
			style={[
				styles.row,
				{ backgroundColor: StyleSheet.flatten(options.headerStyle)?.backgroundColor },
			]}
		>
			<View style={[styles.column, column && { maxWidth: CONTENT_MAX_WIDTH[column] }]}>
				<Header
					{...rest}
					back={back}
					title={getHeaderTitle(options, route.name)}
					headerLeft={
						typeof headerLeft === 'function'
							? ({ label, ...props }) => headerLeft({ ...props, label: headerBackTitle ?? label })
							: headerLeft === undefined && back
								? ({ label, ...props }) => (
										<HeaderBackButton
											{...props}
											label={headerBackTitle ?? label}
											onPress={navigation.goBack}
										/>
									)
								: headerLeft
					}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { alignItems: 'center' },
	column: { width: '100%' },
});

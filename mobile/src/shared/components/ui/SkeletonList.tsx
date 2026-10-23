import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface SkeletonListProps {
	count?: number;
	row: React.ComponentType;
	/** Placeholder drawn above the rows, inside the same announcement. */
	header?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

/** Screen readers hear « Chargement » once for the whole list, never each block. */
export function SkeletonList({ count = 6, row: Row, header, style }: SkeletonListProps) {
	return (
		<View
			testID="skeleton-list"
			accessible
			accessibilityRole="progressbar"
			accessibilityLabel="Chargement"
			accessibilityState={{ busy: true }}
			style={style}
		>
			{header}
			{Array.from({ length: count }, (_, index) => (
				<Row key={index} />
			))}
		</View>
	);
}

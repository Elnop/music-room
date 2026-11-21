import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createListStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';

type HomeSectionProps = {
	spacer?: 'before' | 'after';
	children: React.ReactNode;
};

export function HomeSection({ spacer, children }: HomeSectionProps) {
	const { styles } = useThemedStyles(createListStyles);

	return (
		<>
			{spacer === 'before' && <View style={styles.sectionSpacer} />}
			<View style={styles.section}>{children}</View>
			{spacer === 'after' && <View style={styles.sectionSpacer} />}
		</>
	);
}

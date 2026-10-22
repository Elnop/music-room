import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

/** Layout shared by the playlists screen, its sections and its skeleton. */
export const createListStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.md,
		},
		section: {
			marginBottom: theme.spacing.sm,
		},
		sectionSpacer: {
			height: theme.spacing.md,
		},
		grid: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			paddingHorizontal: theme.spacing.md,
			gap: 16,
		},
		friendsSkeleton: {
			flexDirection: 'row',
			overflow: 'hidden',
			paddingHorizontal: theme.spacing.md,
			gap: 12,
		},
	});

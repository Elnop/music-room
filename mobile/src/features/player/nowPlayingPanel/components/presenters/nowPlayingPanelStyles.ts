import { StyleSheet } from 'react-native';
import { NOW_PLAYING_PANEL_WIDTH } from '@/shared/constants/layout';
import type { Theme } from '@/shared/theme/types';
import { SPACING } from '@/shared/constants/app';

const GUTTER = SPACING.md;

/** The cover spans the panel, inside its gutters. */
export const PANEL_ARTWORK_SIZE = NOW_PLAYING_PANEL_WIDTH - 2 * GUTTER;

export const UP_NEXT_ARTWORK_SIZE = 40;

export const createStyles = (theme: Theme, separator: string) =>
	StyleSheet.create({
		panel: {
			width: NOW_PLAYING_PANEL_WIDTH,
			borderLeftWidth: 1,
			borderLeftColor: separator,
			backgroundColor: theme.colors.background,
			overflow: 'hidden',
		},
		gradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingStart: GUTTER,
			paddingEnd: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
		},
		heading: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		iconButton: {
			width: 36,
			height: 36,
			alignItems: 'center',
			justifyContent: 'center',
		},
		scroll: { flex: 1 },
		content: { paddingHorizontal: GUTTER, paddingBottom: theme.spacing.lg, gap: theme.spacing.lg },
		titleBlock: { gap: theme.spacing.xs },
		title: {
			fontSize: theme.typography.sizes.xxl,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		artist: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.textSecondary,
		},
		actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
		pill: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
			paddingVertical: theme.spacing.xs,
			paddingHorizontal: theme.spacing.md,
			borderWidth: 1,
			borderColor: theme.colors.border,
		},
		// ShareLinkButton centres itself in its column by default.
		shareButton: { alignSelf: 'auto' },
		pillLabel: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		card: {
			padding: GUTTER,
			gap: theme.spacing.md,
			backgroundColor: theme.colors.surface,
		},
		cardHeader: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: theme.spacing.sm,
		},
		cardTitle: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		link: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
		},
		device: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
		deviceIcon: {
			width: 40,
			height: 40,
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: theme.colors.surfaceAlt,
		},
		deviceText: { flex: 1, minWidth: 0 },
		caption: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
		deviceName: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		remoteName: { color: theme.colors.primary },
		row: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.md,
		},
		rowText: { flex: 1, minWidth: 0 },
		rowTitle: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
	});

export type NowPlayingPanelStyles = ReturnType<typeof createStyles>;

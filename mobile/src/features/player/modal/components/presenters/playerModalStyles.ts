import { Dimensions, Platform, StyleSheet } from 'react-native';
import { BREAKPOINTS, PLAYER_DIALOG_WIDTH } from '@/shared/constants/layout';
import type { Theme } from '@/shared/theme/types';
import { FONT_FAMILIES } from '@/shared/theme/fonts';

export const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2;
/** From one artwork of the carousel to the next: the neighbours' edges peek out on both sides. */
const ARTWORK_GAP = 16;

/** A tablet browser shows the player as a centred dialog; Android tablets keep the full screen. */
export function isPlayerDialog(windowWidth: number): boolean {
	return Platform.OS === 'web' && windowWidth >= BREAKPOINTS.tablet;
}

/** Capped by the height too, so a short screen still fits the bottom row above the navigation bar. */
export function artworkSize(windowWidth: number, windowHeight: number) {
	const playerWidth = isPlayerDialog(windowWidth) ? PLAYER_DIALOG_WIDTH : windowWidth;
	const size = Math.min(playerWidth * 0.75, windowHeight * 0.36);
	return { size, step: size + ARTWORK_GAP };
}
export const HEADER_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export const createStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		container: { flex: 1 },
		modalContent: { backgroundColor: theme.colors.background },
		dialogFrame: { alignItems: 'center', justifyContent: 'center' },
		// Keeps its own height: the full screen's `flex: 1` would give it a basis of 0.
		dialog: {
			flexGrow: 0,
			flexBasis: 'auto',
			width: PLAYER_DIALOG_WIDTH,
			height: '90%',
			maxHeight: 900,
			overflow: 'hidden',
			borderWidth: 1,
			borderColor: theme.colors.borderSubtle,
		},
		dialogBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.backdrop },
		header: { paddingTop: insets.top + 8, alignItems: 'center', paddingBottom: 8 },
		swipeIndicator: { alignItems: 'center', marginBottom: 8 },
		swipeBar: { width: 40, height: 5, opacity: 0.5 },
		closeButton: { position: 'absolute', top: insets.top + 16, left: 20, zIndex: 10 },
		headerButton: {
			width: 40,
			height: 40,
			justifyContent: 'center',
			alignItems: 'center',
		},
		nowPlayingText: {
			fontSize: 12,
			fontFamily: FONT_FAMILIES.semibold,
			letterSpacing: 2,
			marginTop: 8,
		},
		deviceText: {
			flexShrink: 1,
			fontSize: 13,
			fontFamily: FONT_FAMILIES.semibold,
		},
		// Content sits low, within thumb reach; the header keeps only the close chevron.
		mainContent: {
			flex: 1,
			justifyContent: 'flex-end',
			paddingBottom: 8,
		},
		bottomBar: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: 16,
			paddingHorizontal: 24,
			marginTop: 24,
		},
		deviceGroup: {
			flex: 1,
			flexDirection: 'row',
			alignItems: 'center',
			gap: 8,
		},
		bottomSpacer: {
			height: insets.bottom + 20,
		},
		artworkWrapper: {
			alignItems: 'center',
			marginBottom: 32,
		},
		artworkShadow: {
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			...theme.shadows.large,
		},
		artwork: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		neighbourArtwork: { position: 'absolute', top: 0 },
		emptyArtwork: {
			alignItems: 'center',
			justifyContent: 'center',
		},
		trackInfo: {
			paddingHorizontal: 32,
			marginBottom: 32,
		},
		title: {
			fontSize: 24,
			fontFamily: FONT_FAMILIES.bold,
			marginBottom: 8,
			textAlign: 'center',
		},
		artist: {
			fontSize: 17,
			fontFamily: FONT_FAMILIES.medium,
			textAlign: 'center',
		},
		errorContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: 10,
			paddingHorizontal: 16,
			marginHorizontal: 32,
			marginBottom: 16,
			gap: 8,
		},
		errorText: {
			fontSize: 14,
			fontFamily: FONT_FAMILIES.medium,
		},
		progressContainer: {
			paddingHorizontal: 24,
			marginBottom: 24,
		},
		slider: { width: '100%', height: 40 },
		timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
		timeText: { fontSize: 12, fontFamily: FONT_FAMILIES.mono },
		controls: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 40,
			paddingHorizontal: 32,
		},
		secondaryButton: {
			width: 56,
			height: 56,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: { opacity: 0.35 },
		playButton: {
			width: 72,
			height: 72,
			alignItems: 'center',
			justifyContent: 'center',
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			borderBottomWidth: theme.borders.thick * 3,
		},
		loadingContainer: { marginTop: 24, alignItems: 'center' },
		loadingText: { fontSize: 14, fontFamily: FONT_FAMILIES.medium },
	});

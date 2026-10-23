import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types';

export const { width: WINDOW_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2;
// Capped by the height too, so a short screen still fits the bottom row above the navigation bar.
export const ARTWORK_SIZE = Math.min(WINDOW_WIDTH * 0.75, SCREEN_HEIGHT * 0.36);
/** From one artwork of the carousel to the next: the neighbours' edges peek out on both sides. */
export const ARTWORK_STEP = ARTWORK_SIZE + 16;
export const SEEK_STEP_S = 10;
export const HEADER_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export const createStyles = (theme: Theme, insets: { top: number; bottom: number }) =>
	StyleSheet.create({
		container: { flex: 1 },
		modalContent: { backgroundColor: theme.colors.background },
		header: { paddingTop: insets.top + 8, alignItems: 'center', paddingBottom: 8 },
		swipeIndicator: { alignItems: 'center', marginBottom: 8 },
		swipeBar: { width: 40, height: 5, borderRadius: 3, opacity: 0.5 },
		closeButton: { position: 'absolute', top: insets.top + 16, left: 20, zIndex: 10 },
		headerButton: {
			width: 40,
			height: 40,
			borderRadius: 20,
			justifyContent: 'center',
			alignItems: 'center',
		},
		nowPlayingText: {
			fontSize: 12,
			fontWeight: '600',
			letterSpacing: 2,
			marginTop: 8,
		},
		deviceText: {
			flexShrink: 1,
			fontSize: 13,
			fontWeight: '600',
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
			shadowColor: theme.colors.shadow,
			shadowOffset: { width: 0, height: 16 },
			shadowOpacity: 0.3,
			shadowRadius: 24,
			elevation: 16,
		},
		artwork: {
			width: ARTWORK_SIZE,
			height: ARTWORK_SIZE,
			borderRadius: 12,
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
			fontWeight: '700',
			marginBottom: 8,
			textAlign: 'center',
		},
		artist: {
			fontSize: 17,
			fontWeight: '500',
			textAlign: 'center',
		},
		errorContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
			paddingVertical: 10,
			paddingHorizontal: 16,
			marginHorizontal: 32,
			borderRadius: 12,
			marginBottom: 16,
			gap: 8,
		},
		errorText: {
			fontSize: 14,
			fontWeight: '500',
		},
		progressContainer: {
			paddingHorizontal: 24,
			marginBottom: 24,
		},
		slider: { width: '100%', height: 40 },
		timeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
		timeText: { fontSize: 13, fontWeight: '500' },
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
			borderRadius: 28,
			alignItems: 'center',
			justifyContent: 'center',
		},
		disabledIcon: { opacity: 0.35 },
		playButton: {
			width: 72,
			height: 72,
			borderRadius: 36,
			alignItems: 'center',
			justifyContent: 'center',
			shadowColor: theme.colors.shadow,
			shadowOffset: { width: 0, height: 4 },
			shadowOpacity: 0.2,
			shadowRadius: 8,
			elevation: 8,
		},
		loadingContainer: { marginTop: 24, alignItems: 'center' },
		loadingText: { fontSize: 14, fontWeight: '500' },
	});

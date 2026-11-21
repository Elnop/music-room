import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';

export const PIXEL = 3;

export const INK = '#07060B';

export const PIXEL_BORDERS = {
	hairline: 1,
	double: 2,
	thin: PIXEL,
	medium: PIXEL,
	thick: PIXEL,
	small: 0,
	round: 0,
} as const;

export const PIXEL_SHADOWS = {
	small: { boxShadow: `0 ${PIXEL}px 0 0 ${INK}` },
	medium: { boxShadow: `0 ${PIXEL * 2}px 0 0 ${INK}` },
	large: { boxShadow: `0 ${PIXEL * 3}px 0 0 ${INK}` },
} as const;

export const PIXEL_TYPOGRAPHY = {
	families: FONT_FAMILIES,
	sizes: {
		xs: 10,
		xsm: 11,
		sm: 12,
		smd: 13,
		md: 14,
		mlg: 15,
		lg: 16,
		lxl: 17,
		lgxl: 18,
		xl: 20,
		xxl: 24,
		xxlg: 28,
		xxxl: 32,
	},
	lineHeights: {
		xxs: 16,
		xs: 18,
		sm: 20,
		md: 21,
		relaxed: 22,
		lg: 24,
	},
	letterSpacings: {
		caption: 0.5,
		wide: 1,
	},
	displayScale: {
		title: 1.5,
		button: 1.45,
		initials: 1.7,
	},
} as const;

export const FIXED_COLORS = {
	divider: '#3B3358',
	googleSurface: '#FFFFFF',
	googleBorder: '#DADCE0',
	googleMark: '#4285F4',
	googleText: '#3C4043',
	facebook: '#1877F2',
	onFacebook: '#FFFFFF',
	onColor: INK,
	inkDark: INK,
	inkLight: '#FFF3DC',
	backdrop: 'rgba(7, 6, 11, 0.7)',
	shadow: INK,
} as const;

export const AVATAR_COLORS = [
	'#C2185B',
	'#AD1457',
	'#8E24AA',
	'#5E35B1',
	'#3949AB',
	'#1565C0',
	'#00838F',
	'#00796B',
	'#2E7D32',
	'#BF360C',
	'#6D4C41',
	'#455A64',
] as const;

export const GENRE_COLORS = {
	pop: '#FF6FA5',
	rock: '#FF8A3D',
	hiphop: '#B48CFF',
	rnb: '#FF5E6C',
	jazz: '#3DDBB4',
	classical: '#F3E3C0',
	electronic: '#5B8CFF',
	country: '#D9A066',
	latin: '#F7E26B',
	metal: '#9A94A8',
} as const;

export const SPACING = {
	pullXs: -4,
	hairline: 1,
	xxs: 2,
	xxsm: 3,
	xs: 4,
	xsm: 6,
	sm: 8,
	sml: 10,
	smd: 12,
	mds: 14,
	md: 16,
	mdl: 20,
	lg: 24,
	xl: 32,
	xlg: 40,
	xxl: 48,
	xxxl: 60,
} as const;

export const CONTROL_SIZES = {
	iconButton: 32,
	iconButtonLarge: 36,
	iconButtonXl: 40,
	thumbnail: 40,
	slider: 20,
	playerBar: 80,
	headerButton: 36,
	buttonCompact: 28,
	searchBar: 44,
	touchTarget: 44,
	badge: 40,
	keyRow: 45,
	button: 52,
	largeButton: 56,
	toast: 56,
	statusDot: 6,
	switchHeight: 31,
	switchWidth: 51,
	statDivider: 30,
	textArea: 100,
	actionButton: 72,
	codeBoxWidth: 50,
	codeBoxHeight: 60,
	compactCodeBoxWidth: 48,
	compactCodeBoxHeight: 56,
	rowIcon: 36,
	swipeAction: 100,
	resultsList: 200,
	headerBadge: 30,
	tableArtwork: 40,
	trackArtwork: 42,
	addTrackTile: 48,
	coverBand: 260,
	transparentHeader: 60,
	tableIndexColumn: 40,
	tableDurationColumn: 56,
	tableTrailingColumn: 80,
	playlistPicker: 360,
} as const;

import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';

export const PIXEL = 3;

export const INK = '#07060B';

export const PIXEL_BORDERS = {
	hairline: 1,
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
		mdlg: 15,
		lg: 16,
		lgxl: 18,
		xl: 20,
		xxl: 24,
		xxxl: 32,
	},
	lineHeights: {
		body: 20,
		relaxed: 22,
	},
	letterSpacings: {
		caption: 0.5,
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
	hairline: 1,
	xxs: 2,
	pixel: PIXEL,
	xs: 4,
	xsm: 6,
	sm: 8,
	smd: 12,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
} as const;

export const CONTROL_SIZES = {
	iconButton: 32,
	buttonCompact: 28,
	searchBar: 44,
	button: 52,
	toast: 56,
	statusDot: 6,
	statDivider: 30,
	headerButton: 36,
	buttonMedium: 40,
	thumbnail: 40,
	switchHeight: 31,
	switchWidth: 51,
	textArea: 100,
} as const;

import { FONT_FAMILIES } from './fonts';

/** Every outline, radius and shadow offset is a multiple of this pixel. */
export const PIXEL = 3;

export const INK = '#07060B';

/** Pixel art has square corners, even `round`. */
export const PIXEL_BORDERS = {
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
		sm: 12,
		md: 14,
		lg: 16,
		xl: 20,
		xxl: 24,
		xxxl: 32,
	},
} as const;

/** The providers' brand colours follow their guidelines. */
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

/** White initials stay above 4.5:1 contrast on each. */
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

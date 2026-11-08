import { FONT_FAMILIES } from './fonts';

/** The pixel grid: every outline, radius and shadow offset is a multiple of it. */
export const PIXEL = 3;

/** The darkest colour of the palette: pixel outlines and hard shadows. */
export const INK = '#07060B';

/** Pixel art has square corners: `round` stays square too. */
export const PIXEL_BORDERS = {
	thin: PIXEL,
	medium: PIXEL,
	thick: PIXEL,
	small: 0,
	round: 0,
} as const;

/** Hard shadows with no blur, dropped straight down like a pixel sprite's. */
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

/** Every theme spreads these into its colours; the providers' brand colours follow their guidelines. */
export const FIXED_COLORS = {
	divider: '#3B3358',
	googleSurface: '#FFFFFF',
	googleBorder: '#DADCE0',
	googleMark: '#4285F4',
	googleText: '#3C4043',
	facebook: '#1877F2',
	onFacebook: '#FFFFFF',
	/** Text and icons drawn on a coloured fill (primary, success, error). */
	onColor: INK,
	/** High-contrast dark ink for light backgrounds. */
	inkDark: INK,
	/** High-contrast light ink for dark backgrounds. */
	inkLight: '#FFF3DC',
	/** The dimmed backdrop behind a bottom sheet. */
	backdrop: 'rgba(7, 6, 11, 0.7)',
	shadow: INK,
} as const;

/** Backgrounds of the initials avatars: white text stays above 4.5:1 on each. */
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

/** Kept the same across themes. */
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

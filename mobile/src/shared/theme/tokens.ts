export const NEOBRUTALISM_BORDERS = {
	thin: 0,
	medium: 0,
	thick: 1,
	extraThick: 1,

	none: 0,
	small: 8,
	round: 9999,
} as const;

export const NEOBRUTALISM_SHADOWS = {
	small: {
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	medium: {
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
	},
	large: {
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.12,
		shadowRadius: 12,
		elevation: 6,
	},
} as const;

export const NEOBRUTALISM_TYPOGRAPHY = {
	weights: {
		regular: '400' as const,
		medium: '500' as const,
		semibold: '600' as const,
		bold: '700' as const,
		extrabold: '800' as const,
		black: '900' as const,
	},
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
	divider: '#3E3E3E',
	googleSurface: '#FFFFFF',
	googleBorder: '#DADCE0',
	googleMark: '#4285F4',
	googleText: '#3C4043',
	facebook: '#1877F2',
	onFacebook: '#FFFFFF',
	/** Text and icons drawn on a coloured fill (primary, success). */
	onColor: '#FFFFFF',
	/** High-contrast dark ink for light backgrounds. */
	inkDark: '#111111',
	/** High-contrast light ink for dark backgrounds. */
	inkLight: '#FFFFFF',
	/** The dimmed backdrop behind a bottom sheet. */
	backdrop: 'rgba(0, 0, 0, 0.5)',
	shadow: '#000000',
} as const;

/** Kept the same across themes. */
export const GENRE_COLORS = {
	pop: '#FF6B9D',
	rock: '#E74C3C',
	hiphop: '#9B59B6',
	rnb: '#E91E63',
	jazz: '#F39C12',
	classical: '#3498DB',
	electronic: '#00BCD4',
	country: '#8D6E63',
	latin: '#FF5722',
	metal: '#607D8B',
} as const;

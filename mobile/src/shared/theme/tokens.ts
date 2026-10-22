// Minimalist Design Tokens

export const NEOBRUTALISM_BORDERS = {
	// Border widths - minimalist style (no visible borders)
	thin: 0,
	medium: 0,
	thick: 1,
	extraThick: 1,

	// Border radius
	none: 0,
	small: 8,
	round: 9999,
} as const;

export const NEOBRUTALISM_SHADOWS = {
	// Subtle shadows with blur
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

/**
 * Colours that do not change with the theme: the sign-in providers' brand
 * colours (their buttons keep the providers' guidelines) and the divider of the
 * sign-in screens. Every theme spreads them into its colours.
 */
export const FIXED_COLORS = {
	divider: '#3E3E3E',
	googleSurface: '#FFFFFF',
	googleBorder: '#DADCE0',
	googleMark: '#4285F4',
	googleText: '#3C4043',
	facebook: '#1877F2',
	onFacebook: '#FFFFFF',
} as const;

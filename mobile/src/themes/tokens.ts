// Neobrutalism Design Tokens

export const NEOBRUTALISM_BORDERS = {
  // Border widths
  thin: 1,
  medium: 2,
  thick: 3,
  extraThick: 4,

  // Border radius - légèrement arrondi pour modernité
  none: 0,
  small: 4,
  medium: 8,
  round: 9999, // Cercles parfaits
} as const;

export const NEOBRUTALISM_SHADOWS = {
  // Small offset shadow (2px)
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, // Opacité totale (pas de transparence)
    shadowRadius: 0, // Pas de blur
    elevation: 3, // Android
  },

  // Medium offset shadow (4px)
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  // Large offset shadow (6px)
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
} as const;

export const NEOBRUTALISM_TYPOGRAPHY = {
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const, // Par défaut pour la plupart du texte
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

/** The bottom tab bar's height above the safe-area inset; the mini-player sits right on top of it. */
export const TAB_BAR_HEIGHT = 70;

/** Window widths where the tablet and desktop layouts start; below the tablet one is the phone. */
export const BREAKPOINTS = { tablet: 768, desktop: 1024 } as const;

/** The left navigation's width on wide screens; the phone keeps the bottom tab bar. */
export const SIDEBAR_WIDTH = { tablet: 104, desktop: 240 } as const;

/** On wide screens, a screen's content is centred at this width at most. */
export const CONTENT_MAX_WIDTH = { form: 600, content: 960, wide: 1280 } as const;

export type ContentWidth = keyof typeof CONTENT_MAX_WIDTH;

export const DIALOG_MAX_WIDTH = 560;

/** The full player's panel on desktop, docked to the right of the window. */
export const PLAYER_PANEL_WIDTH = 440;

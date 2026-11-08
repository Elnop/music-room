/** Above the safe-area inset; the mini-player sits right on top of it. */
export const TAB_BAR_HEIGHT = 70;

export const BREAKPOINTS = { tablet: 768, desktop: 1024 } as const;

export const SIDEBAR_WIDTH = { tablet: 104, desktop: 240 } as const;

export const CONTENT_MAX_WIDTH = { form: 600, content: 960, wide: 1280 } as const;

export type ContentWidth = keyof typeof CONTENT_MAX_WIDTH;

export const DIALOG_MAX_WIDTH = 560;

export const PLAYER_DIALOG_WIDTH = 440;

export const NOW_PLAYING_PANEL_WIDTH = 360;

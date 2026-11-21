import { Dimensions } from 'react-native';

export const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DISMISS_THRESHOLD = SCREEN_HEIGHT * 0.2;

export const ARTWORK_GAP = 16;

export const HEADER_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

export const DIALOG_MAX_HEIGHT = 900;

export const TITLE_LINE_HEIGHT = 38;

export const TITLE_GAP = 8;

export const ARTIST_LINE_HEIGHT = 22;

export const CAROUSEL_TEXT_GAP = 24;

export const CAROUSEL_TEXT_HEIGHT =
	CAROUSEL_TEXT_GAP + TITLE_LINE_HEIGHT * 2 + TITLE_GAP + ARTIST_LINE_HEIGHT;

export const SWIPE_BAR_SIZE = { width: 40, height: 5 } as const;

export const HEADER_BUTTON_SIZE = 42;

export const LOADING_INSET = 72;

export const SLIDER_HEIGHT = 40;

export const SLIDER_TIME_OFFSET = -8;

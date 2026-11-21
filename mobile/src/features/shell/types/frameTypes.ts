import type { ReactNode } from 'react';

export type FramePlayerBars = {
	playerBar: ReactNode;
	miniPlayer: ReactNode;
};

export type FrameSlots = FramePlayerBars & {
	panel: ReactNode;
	overlays: ReactNode;
};

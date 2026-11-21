import { NOW_PLAYING_PANEL_WIDTH, SIDEBAR_WIDTH } from '@/shared/theme/configs/layoutConfig';
import type { Breakpoint } from '@/shared/theme/types/layoutTypes';

type FrameScreen = {
	breakpoint: Breakpoint;
	isDesktop: boolean;
	width: number;
};

type FrameSides = {
	maxWidth: number;
	besideSidebar: boolean;
	panelOpen: boolean;
};

export function frameContentWidth(screen: FrameScreen, sides: FrameSides): number {
	const sidebar =
		sides.besideSidebar && screen.breakpoint !== 'phone' ? SIDEBAR_WIDTH[screen.breakpoint] : 0;
	const panel =
		sides.besideSidebar && screen.isDesktop && sides.panelOpen ? NOW_PLAYING_PANEL_WIDTH : 0;
	return Math.min(screen.width - sidebar - panel, sides.maxWidth);
}

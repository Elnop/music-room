import type { MenuAnchor } from '@/shared/theme/types/menuTypes';

type MenuPlacement = {
	left: number;
	top?: number;
	bottom?: number;
	maxHeight: number;
};

const GAP = 4;
const MARGIN = 8;
const ROOM_BELOW = 320;

function menuLeft(anchor: MenuAnchor, windowWidth: number, menuWidth: number): number {
	const rightAligned = anchor.x + anchor.width - menuWidth;
	const fitsRight = anchor.x + menuWidth <= windowWidth - MARGIN;
	const wanted = anchor.align === 'start' && fitsRight ? anchor.x : rightAligned;
	return Math.max(MARGIN, Math.min(wanted, windowWidth - menuWidth - MARGIN));
}

export function menuPlacement(
	anchor: MenuAnchor,
	window: { width: number; height: number },
	menuWidth: number,
): MenuPlacement {
	const left = menuLeft(anchor, window.width, menuWidth);
	const buttonBottom = anchor.y + anchor.height;
	const below = window.height - buttonBottom - GAP - MARGIN;
	const above = anchor.y - GAP - MARGIN;

	if (below >= ROOM_BELOW || below >= above) {
		return { left, top: buttonBottom + GAP, maxHeight: below };
	}
	return { left, bottom: window.height - anchor.y + GAP, maxHeight: above };
}

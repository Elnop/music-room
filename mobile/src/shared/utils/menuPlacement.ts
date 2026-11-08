export interface MenuAnchor {
	x: number;
	y: number;
	width: number;
	height: number;
	align?: 'start';
}

interface MenuPlacement {
	left: number;
	top?: number;
	bottom?: number;
	maxHeight: number;
}

const GAP = 4;
const MARGIN = 8;
const ROOM_BELOW = 320;

export function menuPlacement(
	anchor: MenuAnchor,
	window: { width: number; height: number },
	menuWidth: number
): MenuPlacement {
	const rightAligned = anchor.x + anchor.width - menuWidth;
	const fitsRight = anchor.x + menuWidth <= window.width - MARGIN;
	const wanted = anchor.align === 'start' && fitsRight ? anchor.x : rightAligned;
	const left = Math.max(MARGIN, Math.min(wanted, window.width - menuWidth - MARGIN));
	const buttonBottom = anchor.y + anchor.height;
	const below = window.height - buttonBottom - GAP - MARGIN;
	const above = anchor.y - GAP - MARGIN;

	if (below >= ROOM_BELOW || below >= above) {
		return { left, top: buttonBottom + GAP, maxHeight: below };
	}
	return { left, bottom: window.height - anchor.y + GAP, maxHeight: above };
}

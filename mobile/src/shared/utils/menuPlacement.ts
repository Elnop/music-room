/** A button's rectangle in window coordinates, as `measureInWindow` reports it. */
export interface MenuAnchor {
	x: number;
	y: number;
	width: number;
	height: number;
	/** A context menu (a point or the focused element): it starts at the left edge, as the browser's own. */
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
/** Below the button while this much room is left, else on the side with the most room. */
const ROOM_BELOW = 320;

/** A drop-down menu right-aligned on its button, opening downwards unless the window ends too soon. */
export function menuPlacement(
	anchor: MenuAnchor,
	window: { width: number; height: number },
	menuWidth: number
): MenuPlacement {
	const rightAligned = anchor.x + anchor.width - menuWidth;
	// A context menu flips to the left of its point when the window ends on its right.
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

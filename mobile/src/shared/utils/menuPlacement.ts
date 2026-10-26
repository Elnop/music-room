/** A button's rectangle in window coordinates, as `measureInWindow` reports it. */
export interface MenuAnchor {
	x: number;
	y: number;
	width: number;
	height: number;
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
	const left = Math.max(MARGIN, Math.min(rightAligned, window.width - menuWidth - MARGIN));
	const buttonBottom = anchor.y + anchor.height;
	const below = window.height - buttonBottom - GAP - MARGIN;
	const above = anchor.y - GAP - MARGIN;

	if (below >= ROOM_BELOW || below >= above) {
		return { left, top: buttonBottom + GAP, maxHeight: below };
	}
	return { left, bottom: window.height - anchor.y + GAP, maxHeight: above };
}

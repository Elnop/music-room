import { useMemo, useState } from 'react';

/** Whether a mouse pointer is over a view (web); touch screens report no hover between taps. */
export function useHover() {
	const [hovered, setHovered] = useState(false);
	const hoverProps = useMemo(
		() => ({ onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false) }),
		[]
	);
	return { hovered, hoverProps };
}

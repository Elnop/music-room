import { useMemo, useState } from 'react';

export function useHover() {
	const [hovered, setHovered] = useState(false);
	const hoverProps = useMemo(
		() => ({ onPointerEnter: () => setHovered(true), onPointerLeave: () => setHovered(false) }),
		[]
	);
	return { hovered, hoverProps };
}

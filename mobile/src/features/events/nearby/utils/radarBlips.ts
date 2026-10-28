/** Where a blip sits on the half-disc radar, as percentages of its box. */
interface RadarSpot {
	left: number;
	top: number;
}

/** Widest angle from the vertical, in degrees: the blips stay above the horizon. */
const MAX_ANGLE = 70;

/** The same event always lands at the same angle. */
const angleOf = (id: string) => {
	const hash = [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 7);
	return ((hash / 996) * 2 - 1) * MAX_ANGLE;
};

/**
 * The nth nearest event sits on the nth ring out from the user, at the bottom centre:
 * the distance from the centre tells the rank, not a direction.
 */
export function radarSpot(id: string, rank: number, total: number): RadarSpot {
	const reach = (rank + 1) / (total + 1);
	const angle = (angleOf(id) * Math.PI) / 180;
	return {
		left: 50 + Math.sin(angle) * reach * 45,
		top: 100 - Math.cos(angle) * reach * 85,
	};
}

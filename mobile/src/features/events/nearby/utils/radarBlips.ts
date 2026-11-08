interface RadarSpot {
	left: number;
	top: number;
}

const MAX_ANGLE = 70;

const angleOf = (id: string) => {
	const hash = [...id].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 997, 7);
	return ((hash / 996) * 2 - 1) * MAX_ANGLE;
};

export function radarSpot(id: string, rank: number, total: number): RadarSpot {
	const reach = (rank + 1) / (total + 1);
	const angle = (angleOf(id) * Math.PI) / 180;
	return {
		left: 50 + Math.sin(angle) * reach * 45,
		top: 100 - Math.cos(angle) * reach * 85,
	};
}

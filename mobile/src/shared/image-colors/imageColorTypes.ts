export type Rgb = [number, number, number];

export type AdaptivePalette = {
	text: string;
	textSecondary: string;
	buttonBg: string;
	accent: string;
	accentBg: string;
	onAccent: string;
	gradient: [string, string, string, string];
};

export type ReadableSurface = {
	alphas: readonly number[];
	backgrounds: Rgb[];
	pole: Rgb;
};

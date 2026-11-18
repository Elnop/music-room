import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GRID = 24;
const require = createRequire(import.meta.url);
const libraryRoot = dirname(require.resolve('@hackernoon/pixel-icon-library/package.json'));
const output = join(
	dirname(fileURLToPath(import.meta.url)),
	'../src/shared/constants/pixelSprites.ts'
);

const FROM_LIBRARY = {
	play: 'solid/play-solid',
	pause: 'solid/pause-solid',
	plus: 'solid/plus-solid',
	home: 'solid/home-solid',
	tape: 'solid/cassette-tape-solid',
	search: 'solid/search-solid',
	crew: 'solid/users-solid',
	me: 'solid/user-solid',
	back: 'solid/angle-left-solid',
	down: 'solid/chevron-down-solid',
	more: 'solid/ellipses-horizontal-solid',
	globe: 'solid/globe-solid',
	eye: 'solid/eye-solid',
	eyeOff: 'solid/eye-cross-solid',
	lock: 'solid/lock-solid',
	pencil: 'solid/pencil-solid',
	grip: 'solid/bars-solid',
	queue: 'solid/playlist-solid',
	beacon: 'solid/wifi-solid',
	link: 'solid/link-solid',
	note: 'solid/music-solid',
	right: 'solid/angle-right-solid',
	check: 'solid/check-solid',
	close: 'solid/times-solid',
	alert: 'solid/exclamation-triangle-solid',
	info: 'solid/info-circle-solid',
	sync: 'solid/refresh-solid',
	gear: 'solid/cog-solid',
	trash: 'solid/trash-solid',
	mail: 'solid/envelope-solid',
	calendar: 'solid/calender-solid',
	clock: 'solid/clock-solid',
	login: 'solid/login-solid',
	logout: 'solid/logout-solid',
	laptop: 'solid/laptop-solid',
	google: 'brands/google',
	facebook: 'brands/facebook-round',
	share: 'solid/share-solid',
	userAdd: 'solid/user-plus-solid',
	userRemove: 'solid/user-minus-solid',
	volume: 'solid/sound-on-solid',
	mute: 'solid/sound-mute-solid',
	radioOn: 'solid/check-box-solid',
	camera: 'solid/camera-solid',
	pop: 'solid/sparkles-solid',
	rock: 'solid/bolt-solid',
	hiphop: 'solid/headphones-solid',
	rnb: 'solid/heart-solid',
	jazz: 'solid/moon-solid',
	classical: 'solid/crown-solid',
	electronic: 'solid/robot-solid',
	country: 'solid/sun-solid',
	latin: 'solid/fire-solid',
	metal: 'solid/hockey-mask-solid',
};

const EMPTY_FRAMES = { radioOff: 'regular/check-box' };

const HAND_DRAWN = {
	next: [
		'............',
		'............',
		'..#.....##..',
		'..##....##..',
		'..###...##..',
		'..####..##..',
		'..####..##..',
		'..###...##..',
		'..##....##..',
		'..#.....##..',
		'............',
		'............',
	],
	prev: [
		'............',
		'............',
		'..##.....#..',
		'..##....##..',
		'..##...###..',
		'..##..####..',
		'..##..####..',
		'..##...###..',
		'..##....##..',
		'..##.....#..',
		'............',
		'............',
	],
	phone: [
		'...######...',
		'..########..',
		'..#......#..',
		'..#......#..',
		'..#......#..',
		'..#......#..',
		'..#......#..',
		'..#......#..',
		'..########..',
		'..###..###..',
		'..########..',
		'...######...',
	],
	tablet: [
		'............',
		'.##########.',
		'.#........#.',
		'.#........#.',
		'.#........#.',
		'.#........#.',
		'.#........#.',
		'.#........#.',
		'.##########.',
		'.####..####.',
		'.##########.',
		'............',
	],
	bluetooth: [
		'.....#......',
		'.....##.....',
		'.#...#.#....',
		'..#..#..#...',
		'...#.#.#....',
		'....###.....',
		'....###.....',
		'...#.#.#....',
		'..#..#..#...',
		'.#...#.#....',
		'.....##.....',
		'.....#......',
	],
};

const ORDER = [
	'play',
	'pause',
	'next',
	'prev',
	'plus',
	'home',
	'tape',
	'search',
	'crew',
	'me',
	'back',
	'down',
	'more',
	'globe',
	'eye',
	'eyeOff',
	'lock',
	'pencil',
	'grip',
	'queue',
	'phone',
	'beacon',
	'link',
	'note',
	'right',
	'check',
	'close',
	'alert',
	'info',
	'sync',
	'gear',
	'trash',
	'mail',
	'calendar',
	'clock',
	'login',
	'logout',
	'laptop',
	'tablet',
	'google',
	'facebook',
	'share',
	'userAdd',
	'userRemove',
	'volume',
	'mute',
	'bluetooth',
	'radioOn',
	'radioOff',
	'camera',
	'pop',
	'rock',
	'hiphop',
	'rnb',
	'jazz',
	'classical',
	'electronic',
	'country',
	'latin',
	'metal',
];

const attribute = (element, name) => element.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

const pathOutlines = d => {
	const outlines = [];
	let outline = null;
	let start = [0, 0];
	let x = 0;
	let y = 0;
	let command = null;
	const tokens = d.match(/[MmHhVvLlZz]|-?\d*\.?\d+/g);
	for (let i = 0; i < tokens.length;) {
		if (/[A-Za-z]/.test(tokens[i])) {
			command = tokens[i++];
			if (command === 'Z' || command === 'z') [x, y] = start;
			continue;
		}
		const value = () => Number(tokens[i++]);
		if (command === 'M' || command === 'm') {
			const dx = value();
			const dy = value();
			[x, y] = command === 'M' ? [dx, dy] : [x + dx, y + dy];
			start = [x, y];
			outline = [[x, y]];
			outlines.push(outline);
			command = command === 'M' ? 'L' : 'l';
			continue;
		}
		if (command === 'L') [x, y] = [value(), value()];
		else if (command === 'l') [x, y] = [x + value(), y + value()];
		else if (command === 'H') x = value();
		else if (command === 'h') x += value();
		else if (command === 'V') y = value();
		else if (command === 'v') y += value();
		else throw new Error(`Unsupported path command ${command}`);
		outline.push([x, y]);
	}
	return outlines;
};

const shapeOutlines = element => {
	if (element.startsWith('<polygon')) {
		const points = attribute(element, 'points')
			.trim()
			.split(/[\s,]+/)
			.map(Number);
		return [
			Array.from({ length: points.length / 2 }, (_, i) => [points[2 * i], points[2 * i + 1]]),
		];
	}
	if (element.startsWith('<rect')) {
		const x = Number(attribute(element, 'x') ?? 0);
		const y = Number(attribute(element, 'y') ?? 0);
		const width = Number(attribute(element, 'width'));
		const height = Number(attribute(element, 'height'));
		return [
			[
				[x, y],
				[x + width, y],
				[x + width, y + height],
				[x, y + height],
			],
		];
	}
	return pathOutlines(attribute(element, 'd'));
};

const winding = (outlines, px, py) => {
	let total = 0;
	for (const outline of outlines) {
		outline.forEach(([x1, y1], i) => {
			const [x2, y2] = outline[(i + 1) % outline.length];
			const side = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
			if (y1 <= py && y2 > py && side > 0) total++;
			if (y1 > py && y2 <= py && side < 0) total--;
		});
	}
	return total;
};

const rasterize = file => {
	const svg = readFileSync(join(libraryRoot, 'icons/SVG', `${file}.svg`), 'utf8');
	const shapes = (svg.match(/<(polygon|rect|path)\b[^>]*>/g) ?? []).map(shapeOutlines);
	return Array.from({ length: GRID }, (_, row) =>
		Array.from({ length: GRID }, (_, column) =>
			shapes.some(outlines => winding(outlines, column + 0.5, row + 0.5) !== 0) ? '#' : '.'
		).join('')
	);
};

const emptyFrame = rows => {
	const frameTop = rows.findIndex(row => row.includes('#'));
	const inside = rows.findIndex((row, y) => y > frameTop && row[GRID / 2] === '.');
	const border = rows[inside].indexOf('.', rows[inside].indexOf('#'));
	return rows.map((row, y) =>
		y < inside || y >= GRID - inside
			? row
			: row.slice(0, border) + '.'.repeat(GRID - 2 * border) + row.slice(GRID - border)
	);
};

const doubled = rows =>
	rows.flatMap(row => {
		const wide = [...row].map(pixel => pixel + pixel).join('');
		return [wide, wide];
	});

const sprite = name => {
	if (FROM_LIBRARY[name]) return rasterize(FROM_LIBRARY[name]);
	if (EMPTY_FRAMES[name]) return emptyFrame(rasterize(EMPTY_FRAMES[name]));
	return doubled(HAND_DRAWN[name]);
};

const body = ORDER.map(
	name =>
		`\t${name}: [\n${sprite(name)
			.map(row => `\t\t'${row}',\n`)
			.join('')}\t],\n`
).join('');

writeFileSync(
	output,
	`export const PIXEL_SPRITES = {\n${body}} as const;\n\nexport type PixelSpriteName = keyof typeof PIXEL_SPRITES;\n`
);

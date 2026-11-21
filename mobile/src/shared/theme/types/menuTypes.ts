export type MenuAnchor = {
	x: number;
	y: number;
	width: number;
	height: number;
	align?: 'start';
};

export type ContextMenuProps = {
	onContextMenu?: unknown;
	onKeyDown?: unknown;
};

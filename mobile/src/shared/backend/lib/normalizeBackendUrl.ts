const URL_PARTS = /^(https?):\/\/([^/?#@\s]*)\/*$/iu;
const AUTHORITY = /^(\[[0-9a-f:.]+\]|[a-z0-9-]+(?:\.[a-z0-9-]+)*)(?::(\d{1,5}))?$/iu;

export function normalizeBackendUrl(input: string): string | null {
	const parts = URL_PARTS.exec(input.trim());
	if (!parts) return null;
	const authority = AUTHORITY.exec(parts[2]);
	if (!authority) return null;
	const port = authority[2];
	if (port !== undefined && (Number(port) < 1 || Number(port) > 65535)) return null;
	return `${parts[1]}://${parts[2]}`;
}

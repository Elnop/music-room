/** `.or()` takes a raw filter: the value is quoted and LIKE-escaped; `*` (unescapable) becomes `_`. */
export function ilikeContains(text: string): string {
	const literal = text.replace(/[\\%_]/g, char => `\\${char}`).replace(/\*/g, '_');
	const quoted = `%${literal}%`.replace(/[\\"]/g, char => `\\${char}`);
	return `"${quoted}"`;
}

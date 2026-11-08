export function ilikeContains(text: string): string {
	const literal = text.replace(/[\\%_]/g, char => `\\${char}`).replace(/\*/g, '_');
	const quoted = `%${literal}%`.replace(/[\\"]/g, char => `\\${char}`);
	return `"${quoted}"`;
}

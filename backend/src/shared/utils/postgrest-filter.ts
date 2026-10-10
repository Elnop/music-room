/**
 * Value for a PostgREST `ilike` condition inside `.or()` that matches `text`
 * literally anywhere in the column (#236).
 *
 * `.or()` takes a raw filter string: a comma, parenthesis or dot in user input
 * would add conditions or break the filter. The value is wrapped in double
 * quotes (PostgREST then reads it as one value, with `\` escaping `"` and `\`),
 * and the LIKE wildcards `%` and `_` in `text` are escaped so they match
 * themselves. PostgREST also reads `*` as `%` in like patterns, with no way
 * to escape it, so a `*` becomes `_` (any one character, `*` included).
 */
export function ilikeContains(text: string): string {
	const literal = text.replace(/[\\%_]/g, char => `\\${char}`).replace(/\*/g, '_');
	const quoted = `%${literal}%`.replace(/[\\"]/g, char => `\\${char}`);
	return `"${quoted}"`;
}

import type { PolicyBlock, PolicySpan } from '@/features/legal/policyTypes';

export function policyKey(content: PolicySpan | PolicySpan[] | PolicyBlock): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) return content.map(policyKey).join('');
	if ('bold' in content) return content.bold;
	if ('code' in content) return content.code;
	if ('link' in content) return content.link;
	if ('paragraph' in content) return policyKey(content.paragraph);
	return content.list.map(policyKey).join('\n');
}

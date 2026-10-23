// Rule: orchestrator-no-fetch
// Orchestrators must not perform direct network calls; delegate to TanStack Query hooks or service hooks.
// See .agents/rules/components.md#orchestrator-no-fetch

const FORBIDDEN_NETWORK_CALLS = new Set(['fetch', 'apiRequest']);

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that orchestrators do not perform direct network calls',
			category: 'Architecture',
		},
		messages: {
			noDirectFetch:
				"Orchestrators must not make direct network calls ('{{name}}'). Delegate data fetching to TanStack Query hooks or service hooks. See .agents/rules/components.md#orchestrator-no-fetch",
			noRawApiClientImport:
				'Orchestrators must not import the raw API client ({{source}}). Use query hooks or service hooks. See .agents/rules/components.md#orchestrator-no-fetch',
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		const isOrchestrator =
			(filename.includes('/orchestrators/') || /Orchestrator\.[jt]sx?$/.test(filename)) &&
			!filename.includes('.test.');

		if (!isOrchestrator) return {};

		function getCalleeName(callee) {
			if (callee.type === 'Identifier') return callee.name;
			if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
				if (callee.object?.type === 'Identifier') {
					return `${callee.object.name}.${callee.property.name}`;
				}
				return callee.property.name;
			}
			return null;
		}

		return {
			ImportDeclaration(node) {
				if (node.importKind === 'type') return;
				const source = node.source?.value ?? '';
				if (source.endsWith('/services/api') || source.endsWith('/services/api.js')) {
					context.report({
						node,
						messageId: 'noRawApiClientImport',
						data: { source },
					});
				}
			},
			CallExpression(node) {
				const name = getCalleeName(node.callee);
				if (!name) return;

				if (FORBIDDEN_NETWORK_CALLS.has(name) || name.startsWith('axios.') || name === 'axios') {
					context.report({
						node,
						messageId: 'noDirectFetch',
						data: { name },
					});
				}
			},
			NewExpression(node) {
				if (node.callee?.type === 'Identifier' && node.callee.name === 'XMLHttpRequest') {
					context.report({
						node,
						messageId: 'noDirectFetch',
						data: { name: 'XMLHttpRequest' },
					});
				}
			},
		};
	},
};

// See .agents/rules/components.md#presenter-pure

const FORBIDDEN_STATE_OR_EFFECT_HOOKS = new Set([
	'useState',
	'useReducer',
	'useEffect',
	'useLayoutEffect',
	'useInsertionEffect',
]);

const FORBIDDEN_QUERY_HOOKS = new Set(['useQuery', 'useMutation', 'useInfiniteQuery']);

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce pure presenters: no state, effects, stores or queries',
			category: 'Architecture',
		},
		messages: {
			noStateOrEffect:
				"Presenters must be pure: no state or effects ('{{name}}'). Pass data and callbacks via props. See .agents/rules/components.md#presenter-pure",
			noStore:
				"Presenters must not read stores ('{{name}}'). Pass store state via props from an orchestrator. See .agents/rules/components.md#presenter-pure",
			noStoreImport:
				'Presenters must not import stores ({{source}}). Read store state in an orchestrator. See .agents/rules/components.md#presenter-pure',
			noQuery:
				"Presenters must not perform queries ('{{name}}'). Fetch in orchestrators or hooks. See .agents/rules/components.md#presenter-pure",
			noFetch:
				"Presenters must not perform network calls ('{{name}}'). See .agents/rules/components.md#presenter-pure",
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		const isPresenter = filename.includes('/presenters/') && !filename.includes('.test.');
		if (!isPresenter) return {};

		function getCalleeName(callee) {
			if (callee.type === 'Identifier') return callee.name;
			if (callee.type === 'MemberExpression' && callee.property?.type === 'Identifier') {
				if (callee.object?.type === 'Identifier' && callee.object.name === 'React') {
					return callee.property.name;
				}
				return `${callee.object?.name || ''}.${callee.property.name}`;
			}
			return null;
		}

		return {
			ImportDeclaration(node) {
				if (node.importKind === 'type') return;
				const source = node.source?.value ?? '';
				if (source.includes('/stores/') || source.endsWith('Store')) {
					context.report({
						node,
						messageId: 'noStoreImport',
						data: { source },
					});
				}
			},
			CallExpression(node) {
				const name = getCalleeName(node.callee);
				if (!name) return;

				if (FORBIDDEN_STATE_OR_EFFECT_HOOKS.has(name)) {
					context.report({
						node,
						messageId: 'noStateOrEffect',
						data: { name },
					});
					return;
				}

				if (/^use\w+Store$/.test(name)) {
					context.report({
						node,
						messageId: 'noStore',
						data: { name },
					});
					return;
				}

				if (FORBIDDEN_QUERY_HOOKS.has(name) || /^use\w+(Query|Mutation)$/.test(name)) {
					context.report({
						node,
						messageId: 'noQuery',
						data: { name },
					});
					return;
				}

				if (name === 'fetch' || name === 'apiRequest' || name.startsWith('axios.')) {
					context.report({
						node,
						messageId: 'noFetch',
						data: { name },
					});
				}
			},
		};
	},
};

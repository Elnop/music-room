// Rule: hook-no-jsx
// Hooks must contain logic only and zero JSX elements.
// See .agents/rules/components.md#hook-no-jsx

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that hooks do not return or contain JSX',
			category: 'Architecture',
		},
		messages: {
			noJsxElement:
				"Hooks must not contain JSX elements ('<{{tag}}>'). Return data and callbacks; let presenters and orchestrators render JSX. See .agents/rules/components.md#hook-no-jsx",
			noJsxFragment:
				'Hooks must not contain JSX fragments. Return data and callbacks; let presenters and orchestrators render JSX. See .agents/rules/components.md#hook-no-jsx',
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		const isHookFile =
			(filename.includes('/hooks/') || /use[A-Z]\w*\.[jt]sx?$/.test(filename)) &&
			!filename.includes('.test.');

		if (!isHookFile) return {};

		function getTagName(node) {
			const opening = node.openingElement;
			if (!opening) return 'JSX';
			if (opening.name?.type === 'JSXIdentifier') return opening.name.name;
			if (opening.name?.type === 'JSXMemberExpression') {
				return `${opening.name.object?.name || ''}.${opening.name.property?.name || ''}`;
			}
			return 'JSX';
		}

		return {
			JSXElement(node) {
				context.report({
					node,
					messageId: 'noJsxElement',
					data: { tag: getTagName(node) },
				});
			},
			JSXFragment(node) {
				context.report({
					node,
					messageId: 'noJsxFragment',
				});
			},
		};
	},
};

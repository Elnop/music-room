// See .agents/rules/components.md#one-component-per-file

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that each file declares at most one React component',
			category: 'Architecture',
		},
		messages: {
			oneComponentPerFile:
				"Each file must declare at most one React component. Found: {{allNames}}. Extract '{{name}}' into its own file. See .agents/rules/components.md#one-component-per-file",
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		if (filename.includes('.test.') || (!filename.endsWith('.tsx') && !filename.endsWith('.jsx'))) {
			return {};
		}

		const functionStack = [];
		const candidates = new Map();

		function isPascalCase(name) {
			return typeof name === 'string' && /^[A-Z][a-zA-Z0-9]*$/.test(name);
		}

		function enterFunction(node, name) {
			const item = { node, name: name || null, hasJsx: false };
			if (name && isPascalCase(name)) {
				candidates.set(node, item);
			}
			functionStack.push(item);
		}

		function exitFunction() {
			functionStack.pop();
		}

		function recordJsx() {
			// JSX belongs to the nearest enclosing PascalCase function only
			for (let i = functionStack.length - 1; i >= 0; i--) {
				const item = functionStack[i];
				if (item.name && isPascalCase(item.name)) {
					item.hasJsx = true;
					break;
				}
			}
		}

		return {
			FunctionDeclaration(node) {
				enterFunction(node, node.id?.name);
			},
			'FunctionDeclaration:exit': exitFunction,

			FunctionExpression(node) {
				let name = node.id?.name;
				if (!name && node.parent?.type === 'VariableDeclarator') {
					name = node.parent.id?.name;
				}
				enterFunction(node, name);
			},
			'FunctionExpression:exit': exitFunction,

			ArrowFunctionExpression(node) {
				let name = null;
				if (node.parent?.type === 'VariableDeclarator') {
					name = node.parent.id?.name;
				} else if (
					node.parent?.type === 'CallExpression' &&
					node.parent.parent?.type === 'VariableDeclarator'
				) {
					// React.memo(() => ...) or forwardRef(() => ...)
					name = node.parent.parent.id?.name;
				}
				enterFunction(node, name);
			},
			'ArrowFunctionExpression:exit': exitFunction,

			JSXElement: recordJsx,
			JSXFragment: recordJsx,

			'Program:exit'() {
				const components = Array.from(candidates.values()).filter(c => c.hasJsx);
				if (components.length <= 1) return;

				const allNames = components.map(c => c.name).join(', ');
				for (let i = 1; i < components.length; i++) {
					const comp = components[i];
					context.report({
						node: comp.node,
						messageId: 'oneComponentPerFile',
						data: {
							name: comp.name,
							allNames,
						},
					});
				}
			},
		};
	},
};

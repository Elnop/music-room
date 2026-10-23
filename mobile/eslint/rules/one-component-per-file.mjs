// Rule: one-component-per-file
// Each file must declare at most one React component.
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

		// Only check component files, not tests or non-tsx files
		if (filename.includes('.test.') || (!filename.endsWith('.tsx') && !filename.endsWith('.jsx'))) {
			return {};
		}

		// Function scope stack to track currently active functions
		const functionStack = [];
		// Map of component node -> { name, hasJsx: boolean }
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
			// Mark all enclosing PascalCase functions as having JSX
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
				// Report every component after the first one
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

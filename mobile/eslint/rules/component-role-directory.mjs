// Rule: component-role-directory
// In features, every component must reside in a role directory (orchestrators/ or presenters/).
// See .agents/rules/components.md#component-role-directory

const ALLOWED_ROLE_DIRECTORIES = ['/orchestrators/', '/presenters/', '/context/'];

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that components in features live inside role directories',
			category: 'Architecture',
		},
		messages: {
			componentOutsideRoleDir:
				"Components in features must live inside an orchestrators/ or presenters/ directory ('{{path}}'). See .agents/rules/components.md#component-role-directory",
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		const isFeatureFile =
			(filename.includes('/src/features/') || filename.startsWith('src/features/')) &&
			!filename.includes('.test.');

		if (!isFeatureFile) return {};

		const isInRoleDir = ALLOWED_ROLE_DIRECTORIES.some(dir => filename.includes(dir));
		if (isInRoleDir) return {};

		let reported = false;

		function checkNode(node) {
			if (reported) return;
			reported = true;
			context.report({
				node,
				messageId: 'componentOutsideRoleDir',
				data: { path: filename },
			});
		}

		return {
			JSXElement: checkNode,
			JSXFragment: checkNode,
		};
	},
};

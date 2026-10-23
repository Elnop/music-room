// Components live in features/<feature>/<subject>/components/(orchestrators|presenters)/, React providers in
// features/<feature>/context/. See .agents/rules/components.md#component-role-directory

const FEATURES_SEGMENT = 'src/features/';

const ALLOWED_FEATURE_PATHS = [
	/^[^/]+\/(?!(?:components|context|hooks)\/)[^/]+\/components\/(orchestrators|presenters)\/[^/]+$/,
	/^[^/]+\/context\/[^/]+$/,
];

function featureRelativePath(filename) {
	if (filename.startsWith(FEATURES_SEGMENT)) return filename.slice(FEATURES_SEGMENT.length);
	const index = filename.lastIndexOf(`/${FEATURES_SEGMENT}`);
	if (index === -1) return null;
	return filename.slice(index + FEATURES_SEGMENT.length + 1);
}

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that components in features live inside role directories',
			category: 'Architecture',
		},
		messages: {
			componentOutsideRoleDir:
				"Components in features must live in features/<feature>/<subject>/components/orchestrators/ or features/<feature>/<subject>/components/presenters/, providers in features/<feature>/context/ ('{{path}}'). See .agents/rules/components.md#component-role-directory",
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		if (filename.includes('.test.')) return {};

		const relativePath = featureRelativePath(filename);
		if (relativePath === null) return {};

		const isInRoleDir = ALLOWED_FEATURE_PATHS.some(pattern => pattern.test(relativePath));
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

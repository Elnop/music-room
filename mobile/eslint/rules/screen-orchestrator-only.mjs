// Rule: screen-orchestrator-only
// A screen or navigation stack/navigator must only import orchestrators from features, never presenters.
// See .agents/rules/components.md#screen-orchestrator-only

export default {
	meta: {
		type: 'problem',
		docs: {
			description: 'Enforce that screens and navigators only import orchestrators from features',
			category: 'Architecture',
		},
		messages: {
			noPresenterInScreen:
				'A screen or navigator must only import orchestrators, not presenters ({{source}}). See .agents/rules/components.md#screen-orchestrator-only',
			screenOrchestratorOnly:
				'A screen file must only import orchestrators from features ({{source}}). See .agents/rules/components.md#screen-orchestrator-only',
		},
		schema: [],
	},
	create(context) {
		const rawPath = context.filename ?? context.getFilename?.() ?? '';
		const filename = rawPath.replace(/\\/g, '/');

		const isHook = filename.includes('/hooks/') || /use[A-Z]/.test(filename);
		if (isHook) return {};

		const isNavigation = filename.includes('/src/navigation/') || filename.startsWith('src/navigation/');
		const isScreenComponent = /[A-Z]\w*Screen\.[jt]sx?$/.test(filename) && !filename.includes('.test.');

		if (!isNavigation && !isScreenComponent) {
			return {};
		}

		return {
			ImportDeclaration(node) {
				if (node.importKind === 'type') return;

				const source = node.source?.value ?? '';
				const isFeatureImport = source.startsWith('@/features/') || source.includes('/features/');

				if (!isFeatureImport) return;

				// Presenters are never allowed in navigation or screens
				if (source.includes('/presenters/')) {
					context.report({
						node,
						messageId: 'noPresenterInScreen',
						data: { source },
					});
					return;
				}

				// For screen component files, any component imported from features must come from orchestrators
				if (isScreenComponent) {
					const hasNonTypeSpecifier = node.specifiers?.some(
						s => s.type === 'ImportSpecifier' && s.importKind !== 'type'
					);
					if (hasNonTypeSpecifier) {
						const isOrchestrator =
							source.includes('/orchestrators/') ||
							node.specifiers.some(s => s.imported?.name?.endsWith('Orchestrator'));
						const isAllowed = isOrchestrator || source.endsWith('/types') || source.includes('/types/');
						if (!isAllowed) {
							context.report({
								node,
								messageId: 'screenOrchestratorOnly',
								data: { source },
							});
						}
					}
				}
			},
		};
	},
};

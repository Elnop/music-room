// Enforces component roles (screens, orchestrators, presenters, hooks) across the mobile app.
// See .agents/rules/components.md

import screenOrchestratorOnly from './rules/screen-orchestrator-only.mjs';
import oneComponentPerFile from './rules/one-component-per-file.mjs';
import orchestratorNoFetch from './rules/orchestrator-no-fetch.mjs';

const plugin = {
	meta: {
		name: 'eslint-plugin-components',
		version: '1.0.0',
	},
	rules: {
		'screen-orchestrator-only': screenOrchestratorOnly,
		'one-component-per-file': oneComponentPerFile,
		'orchestrator-no-fetch': orchestratorNoFetch,
	},
};

export default plugin;

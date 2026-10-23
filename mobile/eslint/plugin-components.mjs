// Enforces component roles (screens, orchestrators, presenters, hooks) across the mobile app.
// See .agents/rules/components.md

import screenOrchestratorOnly from './rules/screen-orchestrator-only.mjs';
import presenterPure from './rules/presenter-pure.mjs';
import hookNoJsx from './rules/hook-no-jsx.mjs';
import oneComponentPerFile from './rules/one-component-per-file.mjs';
import componentRoleDirectory from './rules/component-role-directory.mjs';
import orchestratorNoFetch from './rules/orchestrator-no-fetch.mjs';

const plugin = {
	meta: {
		name: 'eslint-plugin-components',
		version: '1.0.0',
	},
	rules: {
		'screen-orchestrator-only': screenOrchestratorOnly,
		'presenter-pure': presenterPure,
		'hook-no-jsx': hookNoJsx,
		'one-component-per-file': oneComponentPerFile,
		'component-role-directory': componentRoleDirectory,
		'orchestrator-no-fetch': orchestratorNoFetch,
	},
};

export default plugin;

module.exports = {
	extends: require.resolve('@brutalway/dependency-cruiser-config/layers'),
	forbidden: [
		{
			name: 'shared-not-to-app',
			severity: 'error',
			comment:
				'src/shared/ must not import src/app/, which composes the features. See .agents/rules/architecture.md#layers',
			from: { path: '^src/shared/' },
			to: { path: '^src/app/' },
		},
	],
	options: {
		doNotFollow: { path: 'node_modules' },
		tsConfig: { fileName: 'tsconfig.json' },
		tsPreCompilationDeps: false,
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default', 'types', 'react-native'],
			extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
			mainFields: ['react-native', 'module', 'main', 'types'],
		},
	},
};

module.exports = {
  extends: require.resolve('@brutalway/dependency-cruiser-config/layers'),
  forbidden: [
    {
      name: 'shared-not-to-navigation',
      severity: 'error',
      comment:
        'src/shared/ must not import src/navigation/, which composes the features until it becomes src/app/ (#623). See .agents/rules/architecture.md#layers',
      from: { path: '^src/shared/' },
      to: { path: '^src/navigation/' },
    },
    {
      name: 'features-not-to-navigation',
      severity: 'error',
      comment:
        'src/features/ must not import src/navigation/, which composes the features until it becomes src/app/ (#623). See .agents/rules/architecture.md#layers',
      from: { path: '^src/features/' },
      to: { path: '^src/navigation/' },
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
